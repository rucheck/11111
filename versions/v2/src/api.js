/* 前端 API 地址：GitHub Pages 使用公网后端，其余环境保持同源。 */
'use strict';

const ApiConfig = (()=>{
  const PUBLIC_API_BASE_URL = 'https://yanxuan-writer-production.up.railway.app';
  const PUBLIC_FRONTEND_HOSTS = new Set(['rucheck.github.io']);

  function baseUrl(runtimeLocation = typeof location === 'undefined' ? null : location){
    const hostname = String(runtimeLocation?.hostname || '').toLowerCase();
    return PUBLIC_FRONTEND_HOSTS.has(hostname) ? PUBLIC_API_BASE_URL : '';
  }

  function url(pathname,runtimeLocation){
    if(typeof pathname!=='string'||!pathname.startsWith('/api/'))throw new TypeError('API path must start with /api/');
    return `${baseUrl(runtimeLocation)}${pathname}`;
  }

  return Object.freeze({PUBLIC_API_BASE_URL,baseUrl,url});
})();
