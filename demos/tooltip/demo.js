let config = {
    container : {
		id : "#tooltip1",
		title: "Tooltip for",
		width: 200,
		height: 100
	},
	margin : {
		top : 20,
		right : 25,
		bottom : 55,
		left : 25
	},
	bindings: {
		labelField: "lable",
		valueField: "value",
		colorField: "color"
	}
}

let tooltip = kgs.widget.Tooltip.Generator(config).graph();

let data = [
    {"color": "#ff0000", "lable": "first tooltip", "value": 100, "x": 10, "y": 10},
    {"color": "#00ff00", "lable": "second tooltip", "value": 200, "x": 10, "y": 30},
    {"color": "#0000ff", "lable": "third tooltip", "value": 300, "x": 10, "y": 50},
];

tooltip.render(data);

function showPopup() {
	data = [
		{"color": "#ff0000", "lable": "first tooltip", "value": 100, "x": 10, "y": 10},
		{"color": "#00ff00", "lable": "second tooltip", "value": 200, "x": 10, "y": 30},
	];
	tooltip.update(data);
	var popup = document.getElementById("myPopup");
  	popup.classList.toggle("show");
}