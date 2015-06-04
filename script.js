$(function() {
	$.getJSON("http://gsi-cyberjapan.github.io/gsimaps/layers_txt/layers1.txt").done(function(json) {
		json.layers[0].entries.forEach(function(v) {
			dig(v);
		});
		$("input.bg").eq(0).attr("checked", "checked").trigger("change");
		$("input.fg").eq(6).attr("checked", "checked").trigger("change");
	});

	var fg = null;
	var bg = null;

	var map = L.map("map", {
		zoom : 16,
		center : [ 35.6323, 139.768815 ],
		inertia : false
	}).on("mousemove", function(e) {
		if (fg)
			fg.setCenter(e.containerPoint.x, e.containerPoint.y);
	});
	map.attributionControl.setPosition("bottomleft");

	$("#menu ul").on("change", "input.fg", function() {
		if (fg)
			map.removeLayer(fg);
		fg = L.tileLayer.mask($(this).attr("value"));
		map.addLayer(fg);
	}).on("change", "input.bg", function() {
		if (bg)
			map.removeLayer(bg);
		bg = L.tileLayer($(this).attr("value"));
		map.addLayer(bg);
	});

});

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

	var li = $("<li/>");

	if (json.type == "Layer") {
		li.append($("<input/>", {
			type : "radio",
			name : "fg",
			value : json.url,
			"class" : "fg"
		}).data("json", json));
		li.append($("<span/>").text(json.title));
		li.append($("<input/>", {
			type : "radio",
			name : "bg",
			value : json.url,
			"class" : "bg"
		}).data("json", json));
	}

	$("#menu ul").append(li);

	if (json.type == "LayerGroup") {
		li.addClass("heading").text(json.title);
		json.entries.forEach(function(v) {
			dig(v);
		});
	}
}