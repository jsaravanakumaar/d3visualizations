let config = {
    container: {
        id: "#chart",
        width: 800,
        height: 497
    },
    bindings: {
        nodes: {
            id: "id",
            name: "group",
            detailURL: "detailURL",
            nodeType: {
                nodeType: "nodeType"
            }
        }, 
        links: {
            sourceId: "source",
            targetId: "target", 
            forward: "forward",
            reverse: "reverse"
        },
        forwardLink: {
            linkType: "linkType",
            subsystem: "subsystem",
            detailURL: "detailURL"
        },
        reverseLink: {
            linkType: "linkType",
            subsystem: "subsystem",
            detailURL: "detailURL"
        }
    },
    detailViewer: {
        container: {
            id: "detail-viewer",
            width: "400",
            height: "248"
        }
    }
}

var linkExplorer;

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
    linkExplorer = cviz.widget.LinkExplorer.Runner(config).graph();

    loadJSON('./data.json', (data, okText, xhr) => {
        linkExplorer.render(data);
    }, (xhr, errText, err) => {
        console.error(errText, err);
    });
});