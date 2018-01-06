import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';
import registerServiceWorker from './registerServiceWorker';
import { unregister } from './registerServiceWorker';
import { BrowserRouter } from 'react-router-dom'
import { createStore } from 'redux'
import reducer from './reducers'
import { Provider } from 'react-redux'

// react bootstrap
import 'bootstrap/dist/css/bootstrap.css';
import 'sweetalert/dist/sweetalert.css'
import './index.css';

const store = createStore(
  reducer,
)

// BrowserRouter basename={'/proof-of-concept-live-demo'}>
ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);
// registerServiceWorker();
unregister();
