'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {FileReferences} from '../types';

const {
  React,
  ReactDOM,
} = require('react-for-atom');
const {PropTypes} = React;
const FileReferencesView = require('./FileReferencesView');
const FindReferencesModel = require('../FindReferencesModel');

// Number of files to show on every page.
const PAGE_SIZE = 10;
// Start loading more once the user scrolls within this many pixels of the bottom.
const SCROLL_LOAD_THRESHOLD = 250;

function pluralize(noun: string, count: number) {
  return count === 1 ? noun : noun + 's';
}

const FindReferencesView = React.createClass({

  propTypes: {
    model: PropTypes.instanceOf(FindReferencesModel).isRequired,
  },

  getInitialState() {
    const references: Array<FileReferences> = [];
    return {
      loading: true,
      fetched: 0,
      references,
    };
  },

  componentDidMount() {
    this._fetchMore(PAGE_SIZE);
  },

  async _fetchMore(count: number): Promise<void> {
    const next = await this.props.model.getFileReferences(
      this.state.fetched,
      PAGE_SIZE
    );
    this.setState({
      loading: false,
      fetched: this.state.fetched + PAGE_SIZE,
      references: this.state.references.concat(next),
    });
  },

  _onScroll(evt: Event) {
    const root = ReactDOM.findDOMNode(this.refs.root);
    if (this.state.loading || root.clientHeight >= root.scrollHeight) {
      return;
    }
    const scrollBottom = root.scrollTop + root.clientHeight;
    if (root.scrollHeight - scrollBottom <= SCROLL_LOAD_THRESHOLD) {
      this.setState({loading: true});
      this._fetchMore(PAGE_SIZE);
    }
  },

  render(): React.Element {
    const children = this.state.references.map((fileRefs, i) =>
      <FileReferencesView
        key={i}
        {...fileRefs}
        basePath={this.props.model.getBasePath()}
      />
    );

    const refCount = this.props.model.getReferenceCount();
    const fileCount = this.props.model.getFileCount();
    if (this.state.fetched < fileCount) {
      children.push(
        <div
          key="loading"
          className="nuclide-find-references-loading loading-spinner-medium"
        />
      );
    }

    return (
      <div className="nuclide-find-references" onScroll={this._onScroll} ref="root" tabIndex="0">
        <div className="nuclide-find-references-count">
          Found {refCount} {pluralize('reference', refCount)}{' '}
          in {fileCount} {pluralize('file', fileCount)}.
        </div>
        {children}
      </div>
    );
  },

});

module.exports = FindReferencesView;
