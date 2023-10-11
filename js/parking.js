var dataUrl = "http://localhost:8090/iserver/services/data-Community_Latihan/rest/data/datasources/DataLatihan/datasets/ParkingsGround";
var selectedFeature;

$(function () {

    var drawPoint = new SuperMap.Control.DrawFeature(vectorLayer, SuperMap.Handler.Point, {
        multi: false
    });
    drawPoint.events.on({
        "featureadded": drawPointCompleted
    });
    map.addControl(drawPoint);

    // Draw Point
    function drawPointCompleted(e) {
        vectorLayer.removeAllFeatures();
        drawPoint.deactivate();
        var queryByDistanceParams = new SuperMap.REST.QueryByDistanceParameters({
            queryParams: new Array(new SuperMap.REST.FilterParameter({
                name: "ParkingsGround@DataLatihan"
            })),
            returnContent: true,
            isNearest: true,
            distance: 50,
            expectCount: 1,
            geometry: e.feature.geometry
        });
        var queryByDistanceService = new SuperMap.REST.QueryByDistanceService(url);
        queryByDistanceService.events.on({
            "processCompleted": queryByDistanceSuccess,
            "processFailed": processFailed
        });
        queryByDistanceService.processAsync(queryByDistanceParams);
    }

    // Parking Selected Function
    $("#selectParking").click(function () {
        vectorLayer.removeAllFeatures();
        drawPoint.activate();
    });

    function queryByDistanceSuccess(e) {
        selectedFeature = e.result.recordsets[0].features[0];
        var i, j, feature,
            result = e.result;
        if (result && result.recordsets) {
            for (i = 0; i < result.recordsets.length; i++) {
                if (result.recordsets[i].features) {
                    for (j = 0; j < result.recordsets[i].features.length; j++) {
                        feature = result.recordsets[i].features[j];
                        feature.style = {
                            fillColor: "red",
                            strokeColor: "yellow",
                            pointRadius: 6
                        };
                        vectorLayer.addFeatures(feature);
                    }
                }
            }
        }
        closeInfoWin();
        var center = new SuperMap.LonLat(feature.geometry.x, feature.geometry.y);
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
    function processFailed(e) {
        console.log(e);
    };

    $("#deleteParking").click(function () {
        if (selectedFeature == null) {
            alert("Please select a feature first");
        }
        var editFeatureParameter,
            editFeatureService;
        editFeatureParameter = new

            SuperMap.REST.EditFeaturesParameters({

                IDs: [selectedFeature.data.SmID],
                editType: SuperMap.REST.EditType.DELETE
            });
        editFeatureService = new

            SuperMap.REST.EditFeaturesService(dataUrl, {
                eventListeners: {
                    "processCompleted":

                        deleteFeaturesProcessCompleted,

                    "processFailed": processFailed
                }
            });
        editFeatureService.processAsync(editFeatureParameter);
    });

    function deleteFeaturesProcessCompleted(e) {
        layer.redraw();
        vectorLayer.removeAllFeatures();
        alert("Delete parking lot successfully");
        closeInfoWin();
        selectedFeature = null;
    }

    var addPoint = new SuperMap.Control.DrawFeature(vectorLayer, SuperMap.Handler.Point, {
        multi: false
    });
    addPoint.events.on({
        "featureadded": addPointCompleted
    });
    map.addControl(addPoint);

    $("#addParking").click(function () {
        vectorLayer.removeAllFeatures();
        addPoint.activate();
    });

    function addPointCompleted(drawGeometryArgs) {

        addPoint.deactivate();
        var geometry = drawGeometryArgs.feature.geometry;
        var fieldNames = ["Purpose", "Name"];
        var fieldValues = [$("#purpose").val(), $("#name").val()];
        var editFeatureParameter,
            editFeatureService,
            features = {
                fieldNames: fieldNames,
                fieldValues: fieldValues,
                geometry: geometry
            };
        editFeatureParameter = new SuperMap.REST.EditFeaturesParameters({
            features: [features],
            editType: SuperMap.REST.EditType.ADD,

            returnContent: false
        });
        editFeatureService = new SuperMap.REST.EditFeaturesService(dataUrl, {
            eventListeners: {
                "processCompleted": addFeaturesProcessCompleted,
                "processFailed": processFailed
            }
        });
        editFeatureService.processAsync(editFeatureParameter);
    }
    function addFeaturesProcessCompleted(e) {
        layer.redraw();
        vectorLayer.removeAllFeatures();
        alert("Add new parking lot successfully");

    }

    $("#modifyParking").click(function () {
        if (selectedFeature == null) {
            alert("Please select a feature first");
        }

        console.log(selectedFeature);

        var fieldNames = ["Purpose", "Name"];
        var fieldValues = [$("#purpose").val(), $("#name").val()];
        var updateFeature = {
            fieldNames: fieldNames,
            fieldValues: fieldValues,
            geometry: selectedFeature.geometry
        };
        updateFeature.geometry.id = selectedFeature.data.SmID;
        console.log(updateFeature);
        editFeatureParameter = new SuperMap.REST.EditFeaturesParameters({
            features: [updateFeature],
            editType: SuperMap.REST.EditType.UPDATE
        });
        editFeatureService = new SuperMap.REST.EditFeaturesService(dataUrl, {
            eventListeners: {
                "processCompleted": updateFeaturesProcessCompleted,
                "processFailed": processFailed
            }
        });
        editFeatureService.processAsync(editFeatureParameter);
    });

    function updateFeaturesProcessCompleted(e) {
        alert("Modify parking lot successfully");
        vectorLayer.removeAllFeatures();
        closeInfoWin();
        var queryParam, queryBySQLParams, queryBySQLService;
        queryParam = new SuperMap.REST.FilterParameter({
            name: "ParkingsGround@data",
            attributeFilter: "SmID = " + selectedFeature.data.SmID
        });
        queryBySQLParams = new SuperMap.REST.QueryBySQLParameters({
            queryParams: [queryParam]
        });
        queryBySQLService = new SuperMap.REST.QueryBySQLService(url, {
            eventListeners: {
                "processCompleted": updateQueryCompleted,
                "processFailed": processFailed
            }
        });
        queryBySQLService.processAsync(queryBySQLParams);
    }

    function updateQueryCompleted(e) {
        selectedFeature = null;
        queryByDistanceSuccess(e);
    }

});
