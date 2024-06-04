import axiosBase from 'axios';

const axios = axiosBase.create({
  //  baseURL: 'http://localhost:3000/' 'http://192.168.1.34:3000',
  baseURL: '/',
});

export default axios;
