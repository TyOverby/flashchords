import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import htm from 'htm';

const html = htm.bind(React.createElement);

export { React, ReactDOM, createRoot, html };
