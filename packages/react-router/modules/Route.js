import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";
import matchPath from "./matchPath";

const isEmptyChildren = children => React.Children.count(children) === 0;

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    path: PropTypes.string,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    sensitive: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    location: PropTypes.object
  };

  /* 定义ContextTypes */
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
      route: PropTypes.object.isRequired,
      staticContext: PropTypes.object
    })
  };
  /*
   * https://reactjs.org/docs/legacy-context.html?#updating-context
   * 通过添加childContextTypes以及getChildContext给Route组件(context provider),
   * React会自动传递信息，子树中的任何组件都可以通过定义contextTypes来访问,
   * 如果contextTypes没有定义，context将是一个空对象
  */
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };
  /* 
   * 调用时机： state or props change
   * 问题：如果组件提供的上下文值发生更改，则如果中间父级从shouldComponentUpdate返回false，则使用该值的后代将不会更新
   * 解决方案: https://medium.com/@mweststrate/how-to-safely-use-react-context-b7e343eff076
   */
  getChildContext() {
    return {
      router: {
        // 因为已经定义了ContextTypes，所以可通过this.context对象访问
        ...this.context.router,
        route: {
          location: this.props.location || this.context.router.route.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props, this.context.router)
  };

  computeMatch(
    { computedMatch, location, path, strict, exact, sensitive },
    router
  ) {
    if (computedMatch) return computedMatch; // <Switch> already computed the match for us

    invariant(
      router,
      "You should not use <Route> or withRouter() outside a <Router>"
    );

    const { route } = router;
    const pathname = (location || route.location).pathname;

    // ⬇️ 2
    return matchPath(pathname, { path, strict, exact, sensitive }, route.match);
  }

  componentWillMount() {
    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );

    warning(
      !(
        this.props.component &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored"
    );

    warning(
      !(
        this.props.render &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored"
    );
  }
  // http://www.ayqy.net/blog/%E4%BB%8Ecomponentwillreceiveprops%E8%AF%B4%E8%B5%B7/#articleHeader4
  componentWillReceiveProps(nextProps, nextContext) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
    // 初始化组件后，如果Route组件是Switch组件的子组件，则每次切换路径都会从Switch重新计算computedMatch以及传入最新的location
    this.setState({
      // ⬇️ 1
      match: this.computeMatch(nextProps, nextContext.router)
    });
  }

  render() {
    const { match } = this.state;
    const { children, component, render } = this.props;
    const { history, route, staticContext } = this.context.router;
    const location = this.props.location || route.location;
    const props = { match, location, history, staticContext };

    /*
     * 使用component props, 直接传入所有的数据给component
     *   <Route path="/user/:username" component={User} />
     *   function User({ match }) {
     *     return <h1>Hello {match.params.username}</h1>
     *   }
     */
    if (component) return match ? React.createElement(component, props) : null;

    /* 
     * 使用render props,可以指定特定的数据给component
     * <Route path="/home" render={() => <div>Home</div>}/>
     * const FadingRoute = ({ component: Component, ...rest }) => (
     *   <Route {...rest} render={
     *     props => (
     *       <FadeIn> 
     *         <Component {...props}/>
     *       </FadeIn>
     *     )
     *   }/>
     * )
     */
    if (render) return match ? render(props) : null;
 
    
    /* 
     * 有些时候，你需要渲染一些组件，无论path是否匹配。
     * 如果路由和match无法匹配，则match的值为null。
     * 这允许你根据路由是否匹配动态调整UI
     * example1:
     * <ul>
     *   <ListItemLink to="/somewhere"/>
     *   <ListItemLink to="/somewhere-else"/>
     * </ul>
     * 
     * const ListItemLink = ({ to, ...rest }) => (
     *   <Route
     *     path={to}
     *     children=({ match }) => (
     *       <li className={match ? 'active' : ''}>
     *         <Link to={to} {...rest}/>
     *       </li>
     *    )
     *   >
     * example2:
     * <Route
     *  children={({ match, ...rest }) => (
     *    <Animate>
     *      { match && <Something {...rest}/> }
     *    </Animate
     * )}
     * />
     * )
     */
    if (typeof children === "function") return children(props);

    if (children && !isEmptyChildren(children))
      return React.Children.only(children);

    return null;
  }
}

export default Route;
