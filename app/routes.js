/* eslint flowtype-errors/show-errors: 0 */
import React from "react";
import { Switch, Route } from "react-router";
import App from "./containers/App";
import HomePage from "./containers/HomePage";
import CounterPage from "./containers/CounterPage";
import RutgersBusMap from "./containers/RutgersBusMap";

export default () => (
  <App>
    <Switch>
      <Route path="/rumap" component={RutgersBusMap} />
    </Switch>
  </App>
);
