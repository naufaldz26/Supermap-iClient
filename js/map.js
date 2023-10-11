var map, vectorLayer, infowin;
var closeInfoWin = function () {
  if (infowin) {
    try {
      infowin.hide();
      infowin.destroy();
    } catch (e) { }
  }

};

var url =
  "http://localhost:8090/iserver/services/map-Community_Latihan/rest/maps/CommunityMap";

$(function () {
  //Frame layout initialization
  $("#layout").ligerLayout();
  $("#accordion").ligerAccordion({});

  //Define Map
  map = new SuperMap.Map("map", {
    controls: [
      new SuperMap.Control.Navigation(),
      new SuperMap.Control.Zoom()],
  });

  //Allow Overlay layers on this map
  map.allOverlays = true;
  vectorLayer = new SuperMap.Layer.Vector("Vector Layer");

  //Instantiate the selectFeature control. Call onSelect and onUnselect methods
  //Call onSelect method when the feature is selected. Call onUnselect method when the selected features are canceled
  selectFeature = new SuperMap.Control.SelectFeature(vectorLayer, {
    onSelect: onFeatureSelect,
    onUnselect: onUnFeatureSelect
  });

  //Add control to map
  map.addControl(selectFeature);

  //Activate the control
  selectFeature.activate();

  drawLine = new SuperMap.Control.DrawFeature(vectorLayer, SuperMap.Handler.Path, { multi: true });
  drawLine.events.on({ "featureadded": drawCompleted });
  map.addControl(drawLine);

  drawPolygon = new SuperMap.Control.DrawFeature(vectorLayer, SuperMap.Handler.Polygon);
  drawPolygon.events.on({
    "featureadded": drawCompleted
  });
  map.addControl(drawPolygon);

  layer = new SuperMap.Layer.TiledDynamicRESTLayer("layer", url,
    { cacheEnabled: false }, {

    maxResolution: "auto"

  });

  //Define Layer Object
  layer = new SuperMap.Layer.TiledDynamicRESTLayer("layer", url, null, {
    maxResolution: "auto",
  });

  //Add Listener to the layer
  layer.events.on({
    layerInitialized: addlayer,
  });

  //Add Layer to Map
  function addlayer() {
    map.addLayers([layer, vectorLayer]);

    //Set default center point coordination
    map.setCenter(new SuperMap.LonLat(411531.36, 6181382.98), 1);
  }

  $("#houseSearch").click(function () {

    //Clear the earlier query result
    vectorLayer.removeAllFeatures();

    //Get value from input
    var sql = $("#querykey").val().toString();
    console.log(sql);

    var queryParam = new SuperMap.REST.FilterParameter({
      //Set the query layer
      name: "House@DataLatihan",
      attributeFilter: "SmID =" + sql //Set query SQL conditions
    });

    var queryBySQLParams = new SuperMap.REST.QueryBySQLParameters({
      queryParams: [queryParam]
    });

    var myQueryBySQLService = new SuperMap.REST.QueryBySQLService(url, {
      eventListeners: {
        "processCompleted": queryCompleted,
        "processFailed": queryError
      }
    });
    myQueryBySQLService.processAsync(queryBySQLParams);
  });

  function queryCompleted(queryEventArgs) {
    var style = {
      strokeColor: "#304DBE",
      strokeWidth: 1,
      fillColor: "red",
      fillOpacity: "0.8"
    };
    var i, j, feature,
      result = queryEventArgs.result;
    if (result && result.recordsets) {
      for (i = 0; i < result.recordsets.length; i++) {
        if (result.recordsets[i].features) {
          for (j = 0; j < result.recordsets[i].features.length; j++) {
            feature = result.recordsets[i].features[j];
            console.log(feature);
            feature.style = style;

            vectorLayer.addFeatures(feature);
          }
        }
      }
    }
  }

  // Query Error Function
  function queryError(e) {
    console.log(e);
  }

  // ON FEATURE Function
  function onFeatureSelect(feature) {
    closeInfoWin();
    var center = new SuperMap.LonLat((feature.geometry.bounds.left + feature.geometry.bounds.right) / 2, (feature.geometry.bounds.bottom + feature.geometry.bounds.top) / 2);
    var contentHTML = "<table border='1'>";
    for (i in feature.attributes) {
      if (i != "SmID" && i != "SmUserID" && i != "SmArea" && i != "SmPerimeter") {
        contentHTML += "<tr>";
        contentHTML += "<td>" + i + "</td>";
        contentHTML += "<td>" + feature.attributes[i] + "</td>";
        contentHTML += "</tr>";
      }
    }
    contentHTML += "</table>";
    var icon = new SuperMap.Icon();

    popup = new SuperMap.Popup.Anchored(
      "chicken",
      center,
      new SuperMap.Size(220, 140),
      contentHTML,
      icon,
      true,
      null
    );
    infowin = popup;
    map.addPopup(infowin);
  }

  // CLOSEWIN Function
  function closeInfoWin() {
    if (infowin) {
      try {
        infowin.hide();
        infowin.destroy();
      } catch (e) { }
    }
  }

  // ON UNFEATURE Function
  function onUnFeatureSelect(e) {
    console.log(e);
  }

  // Clear button Function
  $("#clear").click(function () {
    closeInfoWin();
    vectorLayer.removeAllFeatures();
  });

  // Measure button Function
  $("#measureDistance").click(function () {
    drawLine.activate();

  });

  // Draw Line and Polygon
  function drawCompleted(drawGeometryArgs) {
    function drawCompleted(drawGeometryArgs) {

      drawLine.deactivate();
      drawPolygon.deactivate();
      var geometry = drawGeometryArgs.feature.geometry,
        measureParam = new

          SuperMap.REST.MeasureParameters(geometry),

        //Measurement service class, 
        //which is responsible for passing the measurement parameters to the server and obtaining the measurement results returned by the server
        myMeasuerService = new SuperMap.REST.MeasureService(url);
      myMeasuerService.events.on({
        "processCompleted": measureCompleted
      });

      // Judge and assign the measureservice type.
      // Set measuremode.distance when it is determined to be linestring, otherwise measuremode.area
      if (geometry.__proto__.CLASS_NAME == "SuperMap.Geometry.Polygon") {
        myMeasuerService.measureMode =

          SuperMap.REST.MeasureMode.AREA;

      } else {
        myMeasuerService.measureMode =

          SuperMap.REST.MeasureMode.DISTANCE;

      }
      myMeasuerService.processAsync(measureParam);
    };

    function measureCompleted(measureEventArgs) {
      var distance = measureEventArgs.result.distance;
      var area = measureEventArgs.result.area;
      if (area == -1) {
        alert(distance + "m");
      } else {
        alert(area + "m2");
      }
    };

    $("#measureArea").click(function () {
      drawPolygon.activate();
    });
  }
});