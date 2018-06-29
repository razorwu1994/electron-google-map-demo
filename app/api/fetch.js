const getCall = {
  headers: new Headers({
    "Content-Type": "application/json"
  }),
  method: "GET"
};

const simpleFetch = url =>
  fetch(url, getCall).then(res =>
    res.json().then(json => {
      if (res.status >= 400) {
        if (res.status === 401) {
          console.log("err");
        }
        throw json;
      } else {
        return json;
      }
    })
  );
export default { simpleFetch };
