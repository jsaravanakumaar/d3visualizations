let config = {
	container : {
		id : "#chart",
		title: "Temprature comparison across cities",
		showDataLabels: 'no',
		titlePos:4, width: 650, height: 402
	},
	axisRange: {
		y : {min: 10, max:80}
	},
	bindings : {
		x : "date",
		y : "temprature",
		category:"city"
	},
	labels : {
		x : "Date",
		y : "Temperature"
	},
	margin : {
		top : 20,
		right : 25,
		bottom : 25,
		left : 25
	},
	lineStyle: "curved",
	scaling : {
		x : 5,
		y : 1
	},
	scaleFormat: {
		x: "%-m/%Y",
		y: ""
	},
	ticks: {
		x: 5,
		y: 7
	},			  
	tickerAngle:{
		x:0
	}
};

var lineChart;

let loadJSON = function(path, success, error) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}
 
document.addEventListener("DOMContentLoaded", function () {
    lineChart = kgs.widget.LineChart.Generator(config).graph();

    loadJSON('./data-0.json', (data, okText, xhr) => {
        lineChart.render(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
});
 
let updateChart = function() {
    loadJSON('./data-1.json', (data, okText, xhr) => {
		console.dir(data);
        config.container.title = "Updated citiwise temprature comparison";
        lineChart.update(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
}