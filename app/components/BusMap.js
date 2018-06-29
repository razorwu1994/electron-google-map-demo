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
      defaultZoom={13}
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

    this.state = { vehicle: [], route: "" };
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
      if (predictions) {
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
    let ret = "";
    this.state.routeEstimate.map(data => {
      if (data.tag === routeTag && data.predictions) {
        ret = `${data.predictions.minutes} mins or ${
          data.predictions.seconds
        } seconds `;
      }
    });
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
          geodesic={true}
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
          onClick={() => this.togglePrediction(stop._tag)}
          geodesic={true}
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
      // if (Array.isArray(polylines)) polylines = flat(polylines);
      // // console.log("new route", polylines);
      // polylines = (
      //   <Polyline
      //     key={"path_" + this.state.route}
      //     path={polylines}
      //     geodesic={true}
      //     options={{
      //       strokeColor: routeColors[this.state.route]
      //     }}
      //   />
      // );
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
          containerElement={<div style={{ height: `400px` }} />}
          mapElement={<div style={{ height: `100%` }} />}
        />
        <div style={{ textAlign: "center", marginTop: "10%" }}>
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
          <h4>Bus Estimate: {this.state.description}</h4>
        </div>
      </div>
    );
  }
}
