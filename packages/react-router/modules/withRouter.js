import React from "react";
import PropTypes from "prop-types";
import hoistStatics from "hoist-non-react-statics";
import Route from "./Route";

/**
 * A public higher-order component to access the imperative API
 */
const withRouter = Component => {
  // 作用:
  // 1. 用于注入{ match, location, history, staticContext }等数据
  // 2. 提供wrappedComponentRef字段，使得用户有机会获取非路由组件内层的react element对象
  // 场景:https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/guides/redux.md
  // 1. componet is connected to redux via connect(Comp)
  // 2. component is not a route component, meaning it is not rendered like so: <Route component={SomeConnectedThing}/>
  const C = props => {
    const { wrappedComponentRef, ...remainingProps } = props;
    return (
      <Route
        children={routeComponentProps => (
          <Component
            {...remainingProps}
            {...routeComponentProps}
            ref={wrappedComponentRef}
          />
        )}
      />
    );
  };

  C.displayName = `withRouter(${Component.displayName || Component.name})`;
  // 3.暴露WrappedComponent静态属性，便于测试该包装组件
  // 示例:
  // MyComponent.js
  // export default withRouter(MyComponent)
  // MyComponent.test.js
  // import MyComponent from './MyComponent'
  // render(<MyComponent.WrappedComponent location={{...}} ... />)
  C.WrappedComponent = Component;
  C.propTypes = {
    wrappedComponentRef: PropTypes.func
  };

  return hoistStatics(C, Component);
};

export default withRouter;
