let sankeyDiagram;

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
    container: {id: "#chart", title: "Greenhouse gas production in 2005", titlePos:5, width: 1100, height: 650},
    sankey: {nodeWidth: 36, nodePadding: 10},
    margin : {top : 15, left : 25, right : 25, bottom : 5}
};
 
document.addEventListener("DOMContentLoaded", function () {
    sankeyDiagram = kgs.widgets.SankeyDiagram.Generator(config).graph();

    loadJSON('./data0.json', (data, okText, xhr) => {
        sankeyDiagram.render(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
});
 
let updateChart = function() {
    loadJSON('./data1.json', (data, okText, xhr) => {
        config.container.title = "Greenhouse gas production in 2006";
        sankeyDiagram.update(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
}