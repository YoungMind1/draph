import React, { HTMLProps } from 'react';
import { Pane } from '../Pane.jsx';
import { QueryLink } from '../QueryLink.jsx';
import { default as FileUploadControl } from './FileUploadControl.jsx';
import QueryInput from './QueryInput.jsx';

/**
 * @param {HTMLProps<HTMLDivElement>} props
 */
export default function InfoPane(props) {
  return (
    <Pane style={{ display: 'flex', flexDirection: 'column' }} {...props}>
      <h3>
        NPM name(s) or <code>package.json</code> URL
      </h3>

      <QueryInput />

      <p>
        For example, try{' '}
        <QueryLink query="express">&quot;express&quot;</QueryLink>,{' '}
        <QueryLink query={['minimatch', 'cross-env', 'rimraf']}>
          &quot;minimatch, cross-env, rimraf&quot;
        </QueryLink>
        , or{' '}
        <QueryLink query="https://github.com/npmgraph/npmgraph/blob/main/package.json">
          npmgraph's package.json on GitHub
        </QueryLink>
        .
      </p>

      <h3>
        Upload a <code>package.json</code> file
      </h3>

      <FileUploadControl />
    </Pane>
  );
}
