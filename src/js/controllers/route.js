import _ from "lodash";
import Bacon from "baconjs";

export function getRoutes(B, routes) {
  const buses = B.fromRoutes({
    routes
  });

  return Object.keys(buses).reduce(
    (acc, routeName) => ({
      ...acc,
      [routeName]: buses[routeName].toProperty()
    }),
    {}
  );
}

export function browseTo(B, dest) {
  B.history.pushState(null, null, dest);
}

export function redirectRoute(B, routes, src, dest) {
  routes[src].onValue(() => browseTo(B, dest));
}

export function getCurrentRoute(routes) {
  return _.reduce(
    routes,
    function(p_route, stream, name) {
      return name === "errors"
        ? p_route
        : p_route.merge(stream.toEventStream().map(name));
    },
    Bacon.never()
  ).toProperty();
}

export default (B, routes) => ({
  getRoutes: _.partial(getRoutes, B, routes),
  browseTo: _.partial(browseTo, B),
  redirectRoute: _.partial(redirectRoute, B),
  getCurrentRoute
});
