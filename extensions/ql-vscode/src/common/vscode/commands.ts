import { commands, Disposable } from "vscode";
import { CommandFunction, CommandManager } from "../../packages/commands";
import { extLogger, OutputChannelLogger } from "../logging";
import {
  asError,
  getErrorMessage,
  getErrorStack,
} from "../../pure/helpers-pure";
import { redactableError } from "../../pure/errors";
import { UserCancellationException } from "../../progress";
import {
  showAndLogExceptionWithTelemetry,
  showAndLogWarningMessage,
} from "../../helpers";
import { telemetryListener } from "../../telemetry";

/**
 * Create a command manager for VSCode, wrapping registerCommandWithErrorHandling
 * and vscode.executeCommand.
 */
export function createVSCodeCommandManager<
  Commands extends Record<string, CommandFunction>,
>(outputLogger?: OutputChannelLogger): CommandManager<Commands> {
  return new CommandManager((commandId, task) => {
    return registerCommandWithErrorHandling(commandId, task, outputLogger);
  }, wrapExecuteCommand);
}

/**
 * A wrapper for command registration. This wrapper adds uniform error handling for commands.
 *
 * @param commandId The ID of the command to register.
 * @param task The task to run. It is passed directly to `commands.registerCommand`. Any
 * arguments to the command handler are passed on to the task.
 */
export function registerCommandWithErrorHandling(
  commandId: string,
  task: (...args: any[]) => Promise<any>,
  outputLogger = extLogger,
): Disposable {
  return commands.registerCommand(commandId, async (...args: any[]) => {
    const startTime = Date.now();
    let error: Error | undefined;

    try {
      return await task(...args);
    } catch (e) {
      error = asError(e);
      const errorMessage = redactableError(error)`${
        getErrorMessage(e) || e
      } (${commandId})`;
      const errorStack = getErrorStack(e);
      if (e instanceof UserCancellationException) {
        // User has cancelled this action manually
        if (e.silent) {
          void outputLogger.log(errorMessage.fullMessage);
        } else {
          void showAndLogWarningMessage(errorMessage.fullMessage, {
            outputLogger,
          });
        }
      } else {
        // Include the full stack in the error log only.
        const fullMessage = errorStack
          ? `${errorMessage.fullMessage}\n${errorStack}`
          : errorMessage.fullMessage;
        void showAndLogExceptionWithTelemetry(errorMessage, {
          outputLogger,
          fullMessage,
          extraTelemetryProperties: {
            command: commandId,
          },
        });
      }
      return undefined;
    } finally {
      const executionTime = Date.now() - startTime;
      telemetryListener?.sendCommandUsage(commandId, executionTime, error);
    }
  });
}

/**
 * wrapExecuteCommand wraps commands.executeCommand to satisfy that the
 * type is a Promise. Type script does not seem to be smart enough
 * to figure out that `ReturnType<Commands[CommandName]>` is actually
 * a Promise, so we need to add a second layer of wrapping and unwrapping
 * (The `Promise<Awaited<` part) to get the right types.
 */
async function wrapExecuteCommand<
  Commands extends Record<string, CommandFunction>,
  CommandName extends keyof Commands & string = keyof Commands & string,
>(
  commandName: CommandName,
  ...args: Parameters<Commands[CommandName]>
): Promise<Awaited<ReturnType<Commands[CommandName]>>> {
  return await commands.executeCommand<
    Awaited<ReturnType<Commands[CommandName]>>
  >(commandName, ...args);
}
