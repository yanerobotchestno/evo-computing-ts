import {bukin6, matyasFunction, schaffer2} from "./Functions";

export type ESParams = {
    stopCondition: (iteration: number, maxIteration: number, previousPopulation: Member[], currentPopulation: Member[], distance: number) => boolean;
    maxIteration: number;
    maxDistance: number;
    //mu+lambda
    parentInNewPopulation: boolean;
    parentsCount: number;
    childCount: number;
    function: (x: number, y: number) => number;
    squareDeviant: number;
    mean: number;
    constraints: {
        x: {
            minimum: number;
            maximum: number
        },
        y: {
            minimum: number;
            maximum: number
        }
    }
}

export type Member = {
    x: number;
    y: number;
    F: number;
}

export const stopByIteraion = (iteration: number, maxIteration: number, previousPopulation: Member[], currentPopulation: Member[], distance: number) => {
    return iteration <= maxIteration;
}

export const stopByDistanceBetweenPopulations = (iteration: number, maxIteration: number, previousPopulation: Member[], currentPopulation: Member[], distance: number) => {
    const previousPopulationAverageFitness = previousPopulation.reduce((sum, member) => sum + member.F, 0) / previousPopulation.length;
    const currentPopulationAverageFitness = currentPopulation.reduce((sum, member) => sum + member.F, 0) / currentPopulation.length;

    return Math.abs(currentPopulationAverageFitness - previousPopulationAverageFitness) > distance;
}

export const stopByDistanceBetweenMembers = (iteration: number, maxIteration: number, previousPopulation: Member[], currentPopulation: Member[], distance: number) => {
    const currentPopulationAverageFitness = currentPopulation.reduce((sum, member) => sum + member.F, 0) / currentPopulation.length;
    const squaredFitnessDifferences = currentPopulation.map((member) => {
        const fitnessDifference = member.F - currentPopulationAverageFitness;
        return fitnessDifference * fitnessDifference;
    });

    const variance = squaredFitnessDifferences.reduce((sum, member) => sum + member, 0) / squaredFitnessDifferences.length;

    return Math.sqrt(variance) > distance;
}

const randomNumberInRange = (min: number, max: number) => (Math.random() * (max - min + 1) + min);

function generateStartPopulation(minimumX: number,
                                 maximumX: number,
                                 minimumY: number,
                                 maximumY: number,
                                 populationCount: number,
                                 fitness: (x: number, y: number) => number) {
    const population: Member[] = [];

    for (let i = 0; i < populationCount; i++) {
        const x = randomNumberInRange(minimumX, maximumX);
        const y = randomNumberInRange(minimumY, maximumY);

        population.push({
            x: x,
            y: y,
            F: fitness(x, y)
        });
    }

    return population;
}

function sortByF(data: Member[]): Member[] {
    return data.sort((a, b) => a.F - b.F);
}

function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    return z * stdev + mean;
}

function mutation(parent: Member, mean: number, deviation: number, fitness: (x: number, y: number) => number): Member {
    const dev = gaussianRandom(mean, deviation);
    const x = parent.x + dev;
    const y = parent.y + dev;
    const F = fitness(x, y);

    return {x, y, F}
}


export function ES(options: ESParams) {
    let iteration = 0;
    let population: Member[] = generateStartPopulation(options.constraints.x.minimum, options.constraints.x.maximum, options.constraints.y.minimum, options.constraints.y.maximum,
        options.parentsCount, options.function);
    let cachedPopulation: Member[] = [...population];

    const allPopulations: Member[][] = [];

    allPopulations.push(sortByF(population));

    do {
        let newPopulation: Member[] = [];

        let childs: Member[] = [];

        for (const member of population) {
            if (options.parentInNewPopulation) {
                childs.push(member);
            }

            for (let i = 0; i < options.childCount; i++) {
                childs.push(mutation(member, options.mean, options.squareDeviant, options.function));
            }
        }

        childs = sortByF(childs);

        for (let i = 0; i < options.parentsCount; i++) {
            newPopulation.push(childs[i]);
        }

        //[...deepCopy]
        cachedPopulation = [...population];
        population = [...newPopulation];
        allPopulations.push(sortByF(population));
        console.log("BEST:", population[0].F)
        iteration++;
    }
    while (options.stopCondition(iteration, options.maxIteration, cachedPopulation, population, options.maxDistance))

    for (const member of population) {
        console.log(member)
    }

    return allPopulations;
}

