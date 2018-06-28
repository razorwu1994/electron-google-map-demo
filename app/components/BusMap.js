// @flow
import React, { Component } from "react";
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  Polyline
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
    this.state = { vehicle: [], route: "" };
  }
  componentDidMount() {
    this.refreshAndRetrieval();
  }
  refreshAndRetrieval = () => {
    const ret = simpleFetch().then(data => {
      const { lastTime, vehicle } = data;
      this.setState({
        lastTime: new Date(parseInt(lastTime.time, 10)),
        vehicle
      });
      console.log("update map data");
    });
  };
  toggleBusInfo = routeTag => {
    this.refreshAndRetrieval();
    this.setState({ route: routeTag });
  };

  render() {
    let currentPos = { lat: 40.49572, lng: -74.44396 };

    /**
     * Vehicles
     */
    let vehicle = this.state.vehicle;
    const markers = vehicle.map((bus, index) => (
      <Marker
        key={"bus_" + index}
        position={{ lat: Number(bus.lat), lng: Number(bus.lon) }}
        onClick={() => this.toggleBusInfo(bus.routeTag)}
        icon={busImage[bus.routeTag + "_" + calcHeading(Number(bus.heading))]}
      />
    ));

    /**
     * Stops
     */
    var stops;
    if (this.state.route.length > 0) {
      stops = routes[this.state.route].stop.map((stop, index) => (
        <Marker
          key={"stop_" + index}
          position={{ lat: Number(stop._lat), lng: Number(stop._lon) }}
          onClick={() => this.togglePrediction()}
        />
      ));

      /**
       * Routes
       */
      var polylines;
      if (this.state.route.length > 0) {
        polylines = routes[this.state.route].path.map(path =>
          path.point.map(point => ({
            lat: Number(point._lat),
            lng: Number(point._lon)
          }))
        );
        if (Array.isArray(polylines)) polylines = flat(polylines);
        polylines = (
          <Polyline
            key={"path_" + this.state.route}
            path={polylines}
            strokeWidth={1}
            strokeColor={routeColors[this.state.route]}
          />
        );
      }
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
        </div>
      </div>
    );
  }
}
