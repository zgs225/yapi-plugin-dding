import React, { PureComponent as Component } from 'react';
import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import ProjectMessage from 'client/containers/Project/Setting/ProjectMessage/ProjectMessage.js';
import ProjectEnv from 'client/containers/Project/Setting/ProjectEnv/index.js';
import ProjectRequest from 'client/containers/Project/Setting/ProjectRequest/ProjectRequest';
import ProjectToken from 'client/containers/Project/Setting/ProjectToken/ProjectToken';
import ProjectMock from 'client/containers/Project/Setting/ProjectMock/index.js';
import DdingRobotView from './form.js';
import { connect } from 'react-redux';
const TabPane = Tabs.TabPane;

import 'client/containers/Project/Setting/Setting.scss';

@connect(state => {
  return {
    curProjectRole: state.project.currProject.role
  };
})
class Setting extends Component {
  render() {
    const { projectId } = this.props;
    return (
      <div style={{ padding: '20px 10px',backgroundColor:'white' }}>
        <DdingRobotView projectId={+projectId} />
      </div>
    );
  }
}

export default Setting;
