const host =
  "http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=rutgers&t=0";

const getCall = {
  headers: new Headers({
    "Content-Type": "application/json"
  }),
  method: "GET"
};

const simpleFetch = () =>
  fetch(host, getCall).then(res =>
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
