let config = {
    container: {
        id: "#chart",
        width: 300,
        height: 186,
        radius: 80
    },
    margin: {
        top: 1,
        left: 1,
        right: 1,
        left: 1
    },
    bindings: {
        leftValueField: "left",
        rightValueField: "right"
    },
    left: {
        radius: 70,
        colors: ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff"]
    },
    right: {
        radius: 50,
        colors: ["#006d2c", "#2ca25f", "#66c2a4", "#b2e2e2", "#edf8fb"]
    }
}

let steppedPieChart = kgs.widget.SteppedPieChart.Generator(config).graph();
let counter = 0;
let data0 = [
    {"color": "#ff0000", "lable": "first tooltip", "left": 100, "right": 120, "x": 10, "y": 10},
    {"color": "#00ff00", "lable": "second tooltip", "left": 200, "right": 140, "x": 10, "y": 30},
    {"color": "#0000ff", "lable": "third tooltip", "left": 300, "right": 160, "x": 10, "y": 50}
];

let data1 = [
    {"color": "#ff0000", "lable": "first tooltip", "left": 140, "right": 120, "x": 10, "y": 10},
    {"color": "#00ff00", "lable": "second tooltip", "left": 200, "right": 140, "x": 10, "y": 30},
    {"color": "#0000ff", "lable": "third tooltip", "left": 300, "right": 160, "x": 10, "y": 50},
    {"color": "#f0f0ff", "lable": "fourth tooltip", "left": 180, "right": 160, "x": 10, "y": 70},
    {"color": "#f0f0ff", "lable": "fifth tooltip", "left": 230, "right": 180, "x": 10, "y": 90}
];

steppedPieChart.render(eval("data" + counter));

let onUpdate = function() {
    ++counter;

    steppedPieChart.updateLeftRadius(counter%2 === 1 ? 50 : 70);
    steppedPieChart.updateRightRadius(counter%2 === 1 ? 70 : 50);
    
    steppedPieChart.update(eval("data" + (counter%2)));
}