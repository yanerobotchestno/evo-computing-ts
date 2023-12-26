type Vector = number[];



function matyasFunction(x: Vector): number {
    return 0.26 * (x[0] ** 2 + x[1] ** 2) - 0.48 * x[0] * x[1];
}

function schaffer2(x: Vector): number {
    const fact1: number = Math.pow(Math.sin(x[0] ** 2 - x[1] ** 2), 2) - 0.5;
    const fact2: number = Math.pow(1 + 0.001 * (x[0] ** 2 + x[1] ** 2), 2);

    return 0.5 + fact1 / fact2;
}


function bukin6(x: Vector): number {
    const term1: number = 100 * Math.sqrt(Math.abs(x[1] - 0.01 * x[0] ** 2));
    const term2: number = 0.01 * Math.abs(x[0] + 10);

    return term1 + term2;
}

function stopCondition(criteria: StopCriteria, iteration: number, maxIteration: number, population: number[][], tolPop: number, fitness: number[], tolFunc: number): boolean {
    if (criteria === StopCriteria.Iteration) {
        return iteration < maxIteration
    }

    if (criteria === StopCriteria.Fitness) {
        return stdNumber(fitness) > tolFunc;
    }

    if (criteria === StopCriteria.Population) {
        console.log(iteration, ":", stdVector(population));
        return stdVector(population) > tolPop;
    }

    return true;
}

function differentialEvolution(
    func: (x: Vector) => number,
    bounds: Vector[],
    mutationFactors: number,
    crossoverProbs: number,
    maxIter: number,
    tolPop: number,
    tolFunc: number,
    criteria: StopCriteria
): [Vector, number] {
    const populationSize = 10;
    const dimensions = bounds.length;
    let population = Array.from({length: populationSize}, () => Array.from({length: dimensions}, (_, i) => Math.random() * (bounds[i][1] - bounds[i][0]) + bounds[i][0]));
    let fitness = population.map(individual => func(individual));
    let bestIdx = fitness.indexOf(Math.min(...fitness));
    let best = population[bestIdx];
    let iter = 0;

    do {
        for (let i = 0; i < populationSize; i++) {
            let idxs = Array.from({length: populationSize}).map((_, idx) => idx).filter(idx => idx !== i);
            let selectedIdxs = selectRandomElements(idxs, 3);
            let a = population[selectedIdxs[0]];
            let b = population[selectedIdxs[1]];
            let c = population[selectedIdxs[2]];

            let mutant = a.map((val, j) => val + mutationFactors * (b[j] - c[j]));
            let trial = mutant.map((val, j) => (Math.random() < crossoverProbs) ? val : population[i][j]);

            let trialFitness = func(trial);
            if (trialFitness < fitness[i]) {
                fitness[i] = trialFitness;
                population[i] = trial;
                if (trialFitness < fitness[bestIdx]) {
                    bestIdx = i;
                    best = trial;
                }
            }
        }
        iter++;
        //function stopCondition(criteria: StopCriteria, iteration: number, maxIteration: number, population: number[][], tolPop: number, fitness: number[], tolFunc: number): boolean
    } while (stopCondition(criteria, iter, maxIter, population, tolPop, fitness, tolFunc));

    return [best, fitness[bestIdx]];
}

function stdVector(arr: Vector[]): number {
    const mean = arr.map(val => val.reduce((a, b) => a + b, 0) / val.length).reduce((acc, val) => acc + val, 0) / arr.length;
    return Math.sqrt(arr.map(val => val.reduce((a, b) => a + (b - mean) ** 2, 0) / val.length).reduce((acc, val) => acc + val, 0) / arr.length);
}

function stdNumber(arr: number[]): number {
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    return Math.sqrt(arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / arr.length);
}

function selectRandomElements<T>(arr: T[], count: number): T[] {
    let result = new Array(count);
    let len = arr.length;
    let taken = new Array(len);
    if (count > len) throw new RangeError("selectRandomElements: more elements taken than available");
    while (count--) {
        let x = Math.floor(Math.random() * len);
        result[count] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function main() {
    const bounds: Vector[] = [[-10, 10], [-10, 10]];
    const mutationFactors: number = 2; //[0, 1, 2];
    const crossoverProbs: number = 0.2;//[0.2, 0.5, 0.8];
    const maxIter: number = 1000;
    const tolPop: number = 1e-6;
    const tolFunc: number = 1e-6;
    const stopCriteria: StopCriteria = StopCriteria.Population;

    const [bestSolution, bestFitness] = differentialEvolution(matyasFunction, bounds, mutationFactors, crossoverProbs, maxIter, tolPop, tolFunc, stopCriteria);
    console.log(`Best solution`, bestSolution, bestFitness);
}

main();