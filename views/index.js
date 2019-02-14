import React, { Component } from "react";
import { Row, Col, Form, Icon, Button, Input, message } from "antd";
import axios from 'axios';

class DdingRobotView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ddingHooks: [],
      loading: false
    };
    this.id = 0;
  }

  /**
   * 生命周期函数
   */
  async componentDidMount() {
      const projectId = this.props.match.params.id;
      let resp = await axios.get('/api/plugin/dding_robots/detail', {params: {project_id: projectId}});
      if (resp.data.errcode == 0) {
          let hooks = resp.data.data.hooks;
          if (hooks && hooks.length > 0) {
              hooks = hooks.map((h) => {
                  return {
                      id: this.id++,
                      value: h
                  }
              })
              this.setState({ddingHooks: hooks})
          }
      }
  }

  add = () => {
    let hooks = this.state.ddingHooks;
    hooks.push({
      id: this.id++,
      value: ''
    });
    this.setState({ddingHooks: hooks});
  }

  remove = (id) => {
    const hooks = this.state.ddingHooks;
    this.setState({ddingHooks: hooks.filter(obj => obj.id != id)})
  }

  submit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      const currentProjectId = this.props.match.params.id;
      let payload = {
        project_id: currentProjectId,
        hooks: values.hooks
      };
      this.submitData('/api/plugin/dding_robots/up', payload);
    })
  }

  submitData = async (url, data) => {
    this.setState({loading: true})
    let result =  await axios.post(url, data);
    if (result.data.errcode != 0) {
      message.error(`更新失败: ${result.data.errmsg}`);
    } else {
      message.success(`更新成功`);
    }
    this.setState({loading: false})
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 }
      }
    };
    const formItemLayoutWithOutLabel = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 20, offset: 4 }
      }
    };
    const formItems = this.state.ddingHooks.map((obj, idx) => {
      return (
        <Form.Item key={obj.id}
                   label={idx == 0 ? '添加机器人' : ''}
                   {...(idx === 0 ? formItemLayout : formItemLayoutWithOutLabel)}>
          {getFieldDecorator(`hooks[${obj.id}]`, {
            validateTrigger: ['onChange', 'onBlur'],
            rules: [{
              required: true,
              message: '请输入钉钉机器人 Webhook'
            }],
            initialValue: obj.value
          })(
            <Input placeholder="钉钉机器人 Webhook" style={{ width: '60%', marginRight: 8 }} />
          )}
          <Icon className="dynamic-delete-button" type="minus-circle-o" onClick={(e) => this.remove(obj.id, e)}/>
        </Form.Item>
      );
    });

    return (
      <div className="g-row">
        <div className="m-panel">
          <Row>
            <Col>
              <Form onSubmit={this.submit}>
                {formItems}
                <Form.Item {...formItemLayoutWithOutLabel}>
                  <Button type="dashed" onClick={this.add}>
                    <Icon type="plus" /> 添加机器人
                  </Button>
                </Form.Item>
                <Form.Item {...formItemLayoutWithOutLabel}>
                  <Button type="primary" htmlType="submit" size="large" disabled={this.state.loading ? true : false}>
                    {this.state.loading ? (
                      <Icon type="loading"/>
                    ) : (
                      <Icon type="save"/>
                    )
                    }
                    {this.state.loading ? '保存中...' : '保存'}
                  </Button>
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export default Form.create()(DdingRobotView);
