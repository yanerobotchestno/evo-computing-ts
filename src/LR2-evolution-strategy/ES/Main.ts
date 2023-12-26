import {Plot, plot} from "nodeplotlib";
import {bukin6, matyasFunction, schaffer2} from "./Functions";
import {ES, stopByIteraion} from "./ES";

//Dmytro Ishchenko KH-41
function main() {

    let start = performance.now();

    const result = ES({
        maxDistance: 0.00001,
        stopCondition: stopByIteraion,
        maxIteration: 300,
        //mu+lambda - true
        parentInNewPopulation: false,
        parentsCount: 40,
        mean: 0,
        function: bukin6,
        squareDeviant: 0.1,
        childCount: 7,
        constraints: {
            x: {
                minimum: -15,
                maximum: 3
            },
            y: {
                minimum: -15,
                maximum: 10
            }
        }
    });

    let end = performance.now();

    console.log(end - start);

    const x = [];
    const y = [];


    for (let i = 0; i < result.length ; i++) {
        x.push(i);
        y.push(result[i][0].F);
    }

    const data: Plot[] = [
        {
            x, y, type: 'scatter',
            text:"1234",
            title:{
                text:"asfasf",
                position:"top center"
            },
            name:"ASrfasfa"
        },
    ];

    plot(data);
}

main()