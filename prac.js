function sendResponse(params){
  return {
    data:params?.data ? params.data : null,
    status:params?.status ? params.status : "success",
    ...params
  }
}

console.log(sendResponse())