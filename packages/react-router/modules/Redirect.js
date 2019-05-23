import React from "react";
import PropTypes from "prop-types";
import warning from "warning";
import invariant from "invariant";
import { createLocation, locationsAreEqual } from "history";
import generatePath from "./generatePath";

/**
 * The public API for updating the location programmatically
 * with a component.
 */
class Redirect extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    push: PropTypes.bool,
    /*
     * 当Redirect设置了from字段，from被Switch组件使用并传递computedMatch对象供Redirect组件使用     * 
     * https://github.com/ReactTraining/react-router/issues/4919
     * <Switch>
     *   <Redirect from='/users/:id' to='/users/profile/:id'/>
     *   <Route path='/users/profile/:id' component={Profile}/>
     * </Switch>
     * />
     */
    from: PropTypes.string, // 用于重定向路由时，传递参数
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
  };

  static defaultProps = {
    push: false
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired
      }).isRequired,
      staticContext: PropTypes.object
    }).isRequired
  };

  isStatic() {
    return this.context.router && this.context.router.staticContext;
  }
  // 这是在服务端渲染时，唯一调用的生命周期方法
  componentWillMount() {
    invariant(
      this.context.router,
      "You should not use <Redirect> outside a <Router>"
    );

    if (this.isStatic()) this.perform();
  }

  componentDidMount() {
    if (!this.isStatic()) this.perform();
  }

  componentDidUpdate(prevProps) {
    const prevTo = createLocation(prevProps.to);
    const nextTo = createLocation(this.props.to);

    if (locationsAreEqual(prevTo, nextTo)) {
      warning(
        false,
        `You tried to redirect to the same route you're currently on: ` +
          `"${nextTo.pathname}${nextTo.search}"`
      );
      return;
    }

    this.perform();
  }

  computeTo({ computedMatch, to }) {
     // const { computedMatch, to } = this.props

    if (computedMatch) { // computedMatch from <Switch>
      if (typeof to === "string") {
        return generatePath(to, computedMatch.params);
      } else {
        /* 
        * 当to不是字符串的时候
        * <Redirect
        *   to={{
        *     pathname: 'login',
        *     search: '?utm=your+face',
        *     state: { referrer: currentLocation }
        *   }}
        * />
        */
        return {
          ...to,
          pathname: generatePath(to.pathname, computedMatch.params)
        };
      }
    }

    return to;
  }

  perform() {
    const { history } = this.context.router;
    const { push } = this.props;
    const to = this.computeTo(this.props);

    if (push) {
      /*
       * <Redirect push to="/somewhere/else">
       */
      history.push(to);
    } else {
      history.replace(to);
    }
  }

  render() {
    return null;
  }
}

export default Redirect;
