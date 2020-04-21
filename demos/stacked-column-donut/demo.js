let stackedColumnDonut;

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

let config = {
    container: {id: "#chart", title: "Log Analyzer", titlePos:5, width: 600, height: 371},
    bindings: {level1: "id", level2: "name", value: "count"},
    margin : {top : 50, left : 25, right : 25, bottom : 5}
};
 
document.addEventListener("DOMContentLoaded", function () {
    stackedColumnDonut = kgs.widget.StackedColumnDonut.Generator(config).graph();

    loadJSON('./data0.json', (data, okText, xhr) => {
        stackedColumnDonut.render(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
});
 
let updateChart = function() {
    loadJSON('./data1.json', (data, okText, xhr) => {
        config.container.title = "Log Analyzer updated";
        stackedColumnDonut.update(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
}