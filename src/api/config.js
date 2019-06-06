import request from '@/utils/request'

export function queryConfig(params) {
  return request({
    url: '/push/page',
    method: 'get',
    params
  })
}

export function addConfig(params) {
  return request({
    url: '/push',
    method: 'post',
    params
  })
}

export function updateConfig(params) {
  return request({
    url: '/push',
    method: 'put',
    params
  })
}

export function deleteConfig(params) {
  return request({
    url: '/push',
    method: 'delete',
    params
  })
}

export function pushMessage(params) {
  return request({
    url: '/push/message',
    method: 'post',
    params
  })
}