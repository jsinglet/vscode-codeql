import * as React from "react";
import { useCallback } from "react";
import styled from "styled-components";
import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { SortKey } from "../../pure/variant-analysis-filter-sort";
import { Codicon } from "../common";

const Dropdown = styled(VSCodeDropdown)`
  width: 100%;
`;

type Props = {
  value: SortKey;
  onChange: (value: SortKey) => void;

  className?: string;
};

export const RepositoriesSort = ({ value, onChange, className }: Props) => {
  const handleInput = useCallback(
    (e: InputEvent) => {
      const target = e.target as HTMLSelectElement;

      onChange(target.value as SortKey);
    },
    [onChange],
  );

  return (
    <Dropdown value={value} onInput={handleInput} className={className}>
      <Codicon name="sort-precedence" label="Sort..." slot="indicator" />
      <VSCodeOption value={SortKey.Name}>Name</VSCodeOption>
      <VSCodeOption value={SortKey.ResultsCount}>Results</VSCodeOption>
      <VSCodeOption value={SortKey.Stars}>Stars</VSCodeOption>
      <VSCodeOption value={SortKey.LastUpdated}>Last updated</VSCodeOption>
    </Dropdown>
  );
};
