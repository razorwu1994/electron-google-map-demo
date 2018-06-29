// @flow
import React, { Component } from "react";
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  Polyline,
  Polygon
} from "react-google-maps";
import { simpleFetch } from "../api/fetch";
import { calcHeading } from "../utils/calc-heading";
import { flat } from "../utils/flat";
import { routes, busImage, routeColors } from "../constants/clusters";
const MyMapComponent = withScriptjs(
  withGoogleMap(props => (
    <GoogleMap
      defaultZoom={18}
      defaultCenter={{
        lat: props.currentPos.lat,
        lng: props.currentPos.lng
      }}
    >
      {props.markers}
      {props.polylines}
      {props.stops}
    </GoogleMap>
  ))
);

export default class BusMap extends Component {
  constructor(props) {
    super(props);

    const routeInfo =
      "http://webservices.nextbus.com/service/publicJSONFeed?command=routeConfig&a=rutgers";
    const routine = simpleFetch(routeInfo).then(json => {
      let routes = json.route.map(route => ({ [route.tag]: route.path }));
      routes = routes.reduce((a, b) => ({ ...a, ...b }), {});
      this.setState({ routes });
    });

    this.state = {
      vehicle: [],
      route: "",
      description: { stopName: "", predictions: [] }
    };
  }

  componentDidMount() {
    this.refreshAndRetrieval();
  }

  refreshAndRetrieval = async () => {
    /**
     * Bus real time locations
     */
    const busLoc =
      "http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=rutgers&t=0";
    const { lastTime, vehicle } = await simpleFetch(busLoc);
    // console.log("update map data");

    /**
     * Stop approaching time estimate
     */
    if (this.state.route.length > 0) {
      let stopEstimateQuery =
        "http://webservices.nextbus.com/service/publicJSONFeed?command=predictionsForMultiStops&a=rutgers";

      routes[this.state.route].stop.map(stop => {
        stopEstimateQuery += "&stops=" + this.state.route + "|" + stop._tag;
      });
      const { predictions } = await simpleFetch(stopEstimateQuery);
      let routeEstimate = [];
      if (Array.isArray(predictions)) {
        predictions.map(stop => {
          if (stop.direction) {
            routeEstimate.push({
              title: stop.stopTitle,
              tag: stop.stopTag,
              predictions: stop.direction.prediction
            });
          }
        });
      }
      this.setState({ routeEstimate, loading: false });
    }
    this.setState({
      lastTime: new Date(parseInt(lastTime.time, 10)),
      vehicle
    });
  };
  toggleBusInfo = routeTag => {
    this.refreshAndRetrieval();
    this.setState({ route: routeTag });
  };

  togglePrediction = routeTag => {
    var ret = {};
    if (Array.isArray(this.state.routeEstimate)) {
      this.state.routeEstimate.map(data => {
        if (data.tag === routeTag && data.predictions) {
          if (Array.isArray(data.predictions)) {
            ret.stopName = data.title;
            ret.predictions = [];
            for (let prediction of data.predictions) {
              ret.predictions.push(
                `${prediction.minutes} mins or ${prediction.seconds} seconds`
              );
            }
          } else {
            ret.stopName = data.title;
            ret.predictions = [
              `${data.predictions.minutes} mins or ${
                data.predictions.seconds
              } seconds`
            ];
          }
        }
      });
    }
    this.setState({ description: ret });
  };
  render() {
    let currentPos = { lat: 40.49572, lng: -74.44396 };

    /**
     * Vehicles
     */
    let vehicle = this.state.vehicle;
    let markers;
    if (vehicle) {
      if (!Array.isArray(vehicle)) vehicle = [vehicle];
      markers = vehicle.map((bus, index) => (
        <Marker
          key={"bus_" + index}
          position={{ lat: Number(bus.lat), lng: Number(bus.lon) }}
          onClick={() => this.toggleBusInfo(bus.routeTag)}
          icon={busImage[bus.routeTag + "_" + calcHeading(Number(bus.heading))]}
        />
      ));
    }

    /**
     * Stops
     */
    var stops;
    if (this.state.route.length > 0) {
      stops = routes[this.state.route].stop.map((stop, index) => (
        <Marker
          key={"stop_" + index}
          position={{ lat: Number(stop._lat), lng: Number(stop._lon) }}
          onClick={() => this.togglePrediction(stop._tag, stop._title)}
        />
      ));
    }
    /**
     * Routes
     */
    let polylines;
    if (this.state.route.length > 0) {
      polylines = this.state.routes[this.state.route].map((path, index) => (
        <Polyline
          key={`path_${this.state.route}_${index}`}
          path={path.point.map(point => ({
            lat: Number(point.lat),
            lng: Number(point.lon)
          }))}
          geodesic={true}
          options={{
            strokeColor: routeColors[this.state.route]
          }}
        />
      ));
    }

    return (
      <div>
        <MyMapComponent
          markers={markers}
          stops={stops}
          polylines={polylines}
          currentPos={currentPos}
          googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places"
          loadingElement={<div style={{ height: `100%` }} />}
          containerElement={<div style={{ height: `400px`, width: "100%" }} />}
          mapElement={<div style={{ height: `100%` }} />}
        />
        <div style={{ textAlign: "center", marginTop: "5%" }}>
          <button
            onClick={this.refreshAndRetrieval}
            style={{
              width: "200px",
              height: "50px",
              borderRadius: "10px",
              color: "white",
              background: "rgba(0, 216, 255, 0.5)",
              fontSize: "20px"
            }}
          >
            I am refresh
          </button>
          <h3>Bus Info: {this.state.route}</h3>
          <div>
            <h4>Bus Estimate: </h4>
            <h5>Stop : {this.state.description.stopName}</h5>
            {this.state.description.predictions.map((predic, index) => (
              <h5 key={`predic_${index}`}>{predic}</h5>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
