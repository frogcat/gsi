$(function() {
	$.getJSON("http://gsi-cyberjapan.github.io/gsimaps/layers_txt/layers1.txt").done(function(json) {
		json.layers[0].entries.forEach(function(v) {
			dig(v);
		});
		init();
	});
});

function init() {

	var fg = null;
	var bg = null;
	var map = null;

	var update = function() {
		var center = map.getCenter();
		var zoom = map.getZoom();
		var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
		var a = [];
		a.push(map.getZoom());
		a.push(center.lat.toFixed(precision));
		a.push(center.lng.toFixed(precision));
		if (fg && bg) {
			a.push(fg.json.id);
			a.push(bg.json.id);
			location.hash = "#" + a.join("/");
		}
	};

	var param = location.hash.replace(/^#/, "").split("/");
	var _lat = 35.6323;
	var _lng = 139.768815;
	var _zoom = 15;

	if (param.length == 5) {
		_lat = parseFloat(param[1]);
		_lng = parseFloat(param[2]);
		_zoom = parseInt(param[0]);
		$("input.fg[value='" + param[3] + "']").attr("checked", "checked");
		$("input.bg[value='" + param[4] + "']").attr("checked", "checked");
	}

	if ($("input.fg[checked='checked']").length == 0)
		$("input.fg").eq(0).attr("checked", "checked");
	if ($("input.bg[checked='checked']").length == 0)
		$("input.bg").eq(6).attr("checked", "checked");

	map = L.map("map", {
		zoom : _zoom,
		center : [ _lat, _lng ],
		inertia : false
	}).on("mousemove", function(e) {
		if (fg)
			fg.setCenter(e.containerPoint.x, e.containerPoint.y);
		update();
	}).on("zoomend", function() {
		$(".focus").removeClass("focus");
		$(".zoom" + this.getZoom()).addClass("focus");
		update();
	});

	map.attributionControl.setPosition("bottomleft");

	$("table").on("change", "input.fg", function() {
		if (fg)
			map.removeLayer(fg);
		var json = $(this).closest("tr").data("json");
		json.maskWidth = 600;
		json.maskHeight = 600;
		fg = L.tileLayer.mask(json.url, json);
		fg.json = json;
		map.addLayer(fg);
		update();
	}).on("change", "input.bg", function() {
		if (bg)
			map.removeLayer(bg);
		var json = $(this).closest("tr").data("json");
		bg = L.tileLayer(json.url, json);
		bg.json = json;
		map.addLayer(bg);
		update();
	});

	$("input.bg[checked='checked']").trigger("change");
	$("input.fg[checked='checked']").trigger("change");
	map.fire("zoomend");

}

function score(json) {
	if (json.type == "LayerGroup") {
		var a = 0;
		json.entries.forEach(function(v) {
			a += score(v);
		});
		return a;
	} else if (json.type == "Layer") {
		if (json.url.match(/^.*kml$/) || json.url.match(/^.*geojson$/))
			return 0;
	}
	return 1;
}

function dig(json) {
	if (score(json) == 0)
		return;

	var tr = $("<tr/>");

	switch (json.type) {
	case "Layer":
		tr.append("<td><span class='layer'></span></td>");
		tr.find("span").text(json.title).attr("title", json.title);

		var td = $("<td/>");
		td.appendTo(tr);
		for (var i = 2; i <= 18; i++) {
			var flag = (json.maxZoom && json.maxZoom < i) || (json.minZoom && json.minZoom > i);

			td.append($("<span/>", {
				"title" : (flag ? "NG" : "OK") + " (z=" + i + ")",
				"class" : "zoom zoom" + i
			}).text(flag ? "□" : "■"));
		}

		tr.append("<td title='set as foreground'><input type='radio' name='fg' class='fg'/></td>");
		tr.append("<td title='set as background'><input type='radio' name='bg' class='bg'/></td>");

		tr.find(".fg").attr("value", json.id);
		tr.find(".bg").attr("value", json.id);

		if (json.attribution == "")
			json.attribution = json.html.replace(/div/g, "span");

		tr.data("json", json);

		$("tbody").append(tr);

		break;

	case "LayerGroup":
		tr.append($("<th/>", {
			colspan : 4
		}).text(json.title));

		$("tbody").append(tr);

		json.entries.forEach(function(v) {
			dig(v);
		});
		break;
	}

}