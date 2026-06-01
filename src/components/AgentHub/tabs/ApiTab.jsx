import React from 'react';
import ApiConfig from '../../ApiConfig/index';

export const ApiTab = React.memo(function ApiTab({ config, onChange }) {
  return <ApiConfig config={config} onChange={onChange} />;
});