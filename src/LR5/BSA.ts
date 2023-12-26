import {bukin6, schaffer2} from "../LR2-evolution-strategy/ES/Functions";

interface Bee {
    position: number[];
    fitness: number;
}

enum Stop {
    Iteration,
    Population,
    Fitness
}

class BeeSwarmAlgorithm {
    private bees: Bee[];
    private bestSolution: Bee;
    private dimension: number;
    private bounds: [number, number];
    private a: number;
    private iterationCount: number = 0;
    private previousAverageFitness: number | null = null;
    constructor(
        private populationSize: number,
        private maxIterations: number,
        private minPopulationDistance: number,
        private minFitnessDistance: number,
        private condition: Stop
    ) {
        this.dimension = 2;
        this.bounds = [-5, 5];
        this.a = 0.1;
        this.bees = [];
        this.bestSolution = {position: Array(this.dimension).fill(0), fitness: Number.POSITIVE_INFINITY};
    }

    private isStopConditionMet(): boolean {
        const currentAverageFitness = this.bees.reduce((acc, bee) => acc + bee.fitness, 0) / this.populationSize;


        if (this.condition === Stop.Fitness && this.previousAverageFitness !== null) {
            const isFitnessConditionMet = Math.abs(currentAverageFitness - this.previousAverageFitness) < this.minFitnessDistance;
            this.previousAverageFitness = currentAverageFitness;
            if (isFitnessConditionMet) return true;
        } else {
            this.previousAverageFitness = currentAverageFitness;
        }

        if (this.condition === Stop.Iteration) {
            return this.iterationCount >= this.maxIterations;
        }

        if (this.condition === Stop.Population) {
            let maxDistance = 0;
            let resultDistance = 0;

            for (let i = 0; i < this.populationSize; i++) {
                for (let j = i + 1; j < this.populationSize; j++) {
                    const distance = this.calculateDistance(this.bees[i].position, this.bees[j].position);
                    maxDistance = Math.max(maxDistance, distance);
                    resultDistance = distance;
                }
            }
            return (maxDistance - resultDistance) < this.minPopulationDistance;
        }

        return false;
    }


    private calculateDistance(pos1: number[], pos2: number[]): number {
        return Math.sqrt(pos1.reduce((acc, val, index) => acc + Math.pow(val - pos2[index], 2), 0));
    }

    private static matyasFunction(x: number, y: number): number {
        return 0.26 * (x * x + y * y) - 0.48 * x * y;
    }

    private initializeBees(): void {
        this.bees = [];
        for (let i = 0; i < this.populationSize; i++) {
            const position = Array.from({length: this.dimension}, () => Math.random() * (this.bounds[1] - this.bounds[0]) + this.bounds[0]);
            this.bees.push({position, fitness: this.evaluate(position)});
        }
    }

    private evaluate(position: number[]): number {
        //return BeeSwarmAlgorithm.matyasFunction(position[0], position[1]);
        return bukin6(position[0], position[1]);
        //return schaffer2(position[0], position[1]);
    }

    private updateBees(): void {
        for (let bee of this.bees) {
            for (let j = 0; j < this.dimension; j++) {
                let k: number;
                do {
                    k = Math.floor(Math.random() * this.populationSize);
                } while (k === this.bees.indexOf(bee));

                const gij = Math.random() * 2 * this.a - this.a;
                const vij = bee.position[j] + gij * (bee.position[j] - this.bees[k].position[j]);

                bee.position[j] = Math.min(Math.max(vij, this.bounds[0]), this.bounds[1]);
            }

            const newFitness = this.evaluate(bee.position);

            if (newFitness < bee.fitness) {
                bee.fitness = newFitness;
                if (newFitness < this.bestSolution.fitness) {
                    this.bestSolution = {...bee};
                }
            }
        }
    }


    private greedySelection(): void {
        for (let bee of this.bees) {
            const newPosition = bee.position.map((p, index) => {
                const randBee = this.bees[Math.floor(Math.random() * this.bees.length)];
                const gij = Math.random() * 2 * this.a - this.a;
                return Math.min(Math.max(p + gij * (p - randBee.position[index]), this.bounds[0]), this.bounds[1]);
            });

            const newFitness = this.evaluate(newPosition);

            if (newFitness < bee.fitness) {
                bee.position = newPosition;
                bee.fitness = newFitness;

                if (newFitness < this.bestSolution.fitness) {
                    this.bestSolution = {...bee, position: [...newPosition]};
                }
            }
        }
    }
//Dmytro Ishchenko KH-41
    public execute(): Bee {
        this.initializeBees();
        this.iterationCount = 0;

        do {
            this.updateBees();
            this.greedySelection();
            this.iterationCount++;
        } while (!this.isStopConditionMet())

        return this.bestSolution;
    }
}

const beeSwarm = new BeeSwarmAlgorithm(30, 100, 0.5, 0.01, Stop.Iteration);
const startT = performance.now();
const bestSolution = beeSwarm.execute();
console.log('Best solution:', bestSolution);
console.log(performance.now() - startT);