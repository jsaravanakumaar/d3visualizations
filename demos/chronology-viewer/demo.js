let config = {
	container : {
		id : "#chart",
		title: "The Wealth & Health of Nations",
		showDataLabels: 'no',
		titlePos:4, width: 954, height: 560
	},
	bindings : {
		x : "income",
		y : "lifeExpectancy",
        color : "region",
        radius : "population"
	},
	scale : {
		x : 2,
        y : 1,
        color: 4,
        radius: 3
	},
	margin : {
		top : 20,
		right : 20,
		bottom : 35,
		left : 40
	}
};

var chronologyViewer;

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
    chronologyViewer = kgs.widget.ChronologyViewer.Generator(config).graph();

    loadJSON('./data.json', (data, okText, xhr) => {
        chronologyViewer.render(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
});
 
let updateChart = function() {
    loadJSON('./data.json', (data, okText, xhr) => {
		console.dir(data);
        config.container.title = "Updated citiwise temprature comparison";
        //chronologyViewer.update(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
}