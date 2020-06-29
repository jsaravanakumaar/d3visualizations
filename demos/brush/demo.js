let config = {
    container: {
        id: "#chart",
        width: 800,
        height: 50
    },
    margin: {
        top: 5,
        left: 10,
        right: 10,
        bottom: 15
    },
    bindings: {
        x: "date",
        format: "%b %Y"
    }
}

let brush = kgs.widget.Brush.Generator(config).graph();
let counter = 0;
let data0 = [
    {
      "date": "Jan 2000"
    },
    {
      "date": "Jan 2001"
    },
    {
      "date": "Jan 2002"
    },
    {
      "date": "Jan 2003"
    },
    {
      "date": "Jan 2004"
    },
    {
      "date": "Jan 2005"
    },
    {
      "date": "Jan 2006"
    },
    {
      "date": "Jan 2007"
    },
    {
      "date": "Jan 2008"
    },
    {
      "date": "Jan 2009"
    },
    {
      "date": "Jan 2010"
    },
    {
      "date": "Jan 2011"
    },
    {
      "date": "Jan 2012"
    },
    {
      "date": "Jan 2013"
    },
    {
      "date": "Jan 2014"
    },
    {
      "date": "Jan 2015"
    },
    {
      "date": "Jan 2016"
    },
    {
      "date": "Jan 2017"
    },
    {
      "date": "Jan 2018"
    },
    {
      "date": "Jan 2019"
    },
    {
      "date": "Jan 2020"
    }
   ];

brush.render(eval("data" + counter));

function moveBrush() {
  brush.moveBrush([new Date(2004, 1, 1), new Date(2006, 1, 1)]);
}