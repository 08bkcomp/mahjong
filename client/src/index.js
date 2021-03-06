import React from 'react';
import ReactDOM from 'react-dom';
import {Switch, Route, BrowserRouter} from 'react-router-dom';
import Board from './InGame';
import Lobby from './Lobby';
import Splash from './Splash';
import Testing from './testing';
import './index.css';

ReactDOM.render(
  <BrowserRouter>
    <Switch>
      <Route exact path="/" component={Splash} />
      <Route path="/lobby" component={Lobby} />
      <Route path="/game" component={Board} />
      <Route path="/test" component={Testing} />
    </Switch>
  </BrowserRouter>,
  document.getElementById('root'),
);
