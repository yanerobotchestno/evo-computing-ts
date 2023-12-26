import {distances} from "./Distances";

class Ant {
    public path: number[];
    public pathLength: number;
    public pheromoneDelta: number[][];

    constructor(numCities: number) {
        this.path = [this.chooseStartingCity()];
        this.pathLength = 0;
        this.pheromoneDelta = Array.from({length: numCities}, () => new Array(numCities).fill(0));
    }

    private chooseStartingCity(): number {
        return 6;
    }

    public run(distances: number[][], pheromone: number[][], alpha: number, beta: number): void {
        while (this.path.length < distances.length) {
            const currentCity = this.path[this.path.length - 1];
            const nextCity = this.chooseNextCity(currentCity, distances, pheromone, alpha, beta);
            this.path.push(nextCity);
        }
        this.path.push(this.path[0]);
        this.pathLength = this.calculatePathLength(this.path, distances);
        this.updatePheromoneDelta(this.path, this.pathLength, pheromone);
    }

    private chooseNextCity(currentCity: number, distances: number[][], pheromone: number[][], alpha: number, beta: number): number {
        const probabilities = distances[currentCity]
            .map((_, nextCity) => {
                if (this.path.includes(nextCity)) {
                    return 0;
                }
                const pheromoneLevel = pheromone[currentCity][nextCity];
                const visibility = 1 / distances[currentCity][nextCity];
                return Math.pow(pheromoneLevel, alpha) * Math.pow(visibility, beta);
            });

        const probabilitySum = probabilities.reduce((acc, prob) => acc + prob, 0);
        const normalizedProbabilities = probabilities.map(prob => prob / probabilitySum);

        return this.rouletteWheelSelect(normalizedProbabilities);
    }

    private rouletteWheelSelect(probabilities: number[]): number {
        const randomThreshold = Math.random();
        let cumulativeSum = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeSum += probabilities[i];
            if (cumulativeSum >= randomThreshold) {
                return i;
            }
        }
        return probabilities.length - 1;
    }

    private calculatePathLength(path: number[], distances: number[][]): number {
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            length += distances[path[i]][path[i + 1]];
        }
        return length;
    }

    private updatePheromoneDelta(path: number[], pathLength: number, pheromone: number[][]): void {
        const delta = 1 / pathLength;
        for (let i = 0; i < path.length - 1; i++) {
            this.pheromoneDelta[path[i]][path[i + 1]] += delta;
            this.pheromoneDelta[path[i + 1]][path[i]] += delta;
        }
    }
}

class MMAS {

    private pheromoneMax: number;
    private pheromoneMin: number;

    private bestPathLength: number = Infinity;
    private bestPath: number[] = [];

    private pheromone: number[][];
    private distances: number[][];
    private ants: Ant[];
    private alpha: number;
    private beta: number;
    private evaporationRate: number;

    constructor(distances: number[][], numAnts: number, alpha: number, beta: number, evaporationRate: number) {
        this.pheromoneMax = 1.0;
        this.pheromoneMin = 0.1;

        this.distances = distances;
        this.alpha = alpha;
        this.beta = beta;
        this.evaporationRate = evaporationRate;
        this.pheromone = this.initializePheromone(distances.length);
        this.ants = Array.from({length: numAnts}, () => new Ant(distances.length));
    }

    private initializePheromone(numCities: number): number[][] {
        return Array.from({length: numCities}, () => new Array(numCities).fill(1));
    }

    public run(numIterations: number): void {
        for (let iteration = 0; iteration < numIterations; iteration++) {
            this.ants.forEach(ant => {
                ant.run(this.distances, this.pheromone, this.alpha, this.beta);
                if (ant.pathLength < this.bestPathLength) {
                    this.bestPathLength = ant.pathLength;
                    this.bestPath = [...ant.path];
                }
            });
            this.updatePheromone();
        }

        const pathNames = this.bestPath.map(cityNumber => getCityName(cityNumber));
        console.log(`The shortest path found is: ${pathNames.join(' -> ')} with length: ${this.bestPathLength} km`);
    }


    public getBestPath(): number[] {
        return this.bestPath;
    }

    public getBestPathLength(): number {
        return this.bestPathLength;
    }

    private updatePheromone(): void {
        for (let i = 0; i < this.distances.length; i++) {
            for (let j = 0; j < this.distances[i].length; j++) {
                this.pheromone[i][j] *= (1 - this.evaporationRate);

                this.pheromone[i][j] = Math.max(this.pheromoneMin, Math.min(this.pheromoneMax, this.pheromone[i][j]));
            }
        }

        if (this.bestPathLength < Infinity) {
            const delta = 1 / this.bestPathLength;
            for (let i = 0; i < this.bestPath.length - 1; i++) {
                const from = this.bestPath[i];
                const to = this.bestPath[i + 1];
                this.pheromone[from][to] += delta;
                this.pheromone[to][from] += delta;
            }
        }
    }
}

function getCityName(cityNumber: number): string {
    const cityNames: { [key: number]: string } = {
        0: 'Винница',
        1: 'Днепропетровск',
        2: 'Донецк',
        3: 'Житомир',
        4: 'Запорожье',
        5: 'Ивано-Франковск',
        6: 'Киев',
        7: 'Кировоград',
        8: 'Луганск',
        9: 'Луцк',
        10: 'Львов',
        11: 'Николаев',
        12: 'Одесса',
        13: 'Полтава',
        14: 'Ровно',
        15: 'Симферополь',
        16: 'Сумы',
        17: 'Тернополь',
        18: 'Ужгород',
        19: 'Харьков',
        20: 'Херсон',
        21: 'Хмельницкий',
        22: 'Черкассы',
        23: 'Черновцы',
        24: 'Чернигов'
    };

    return cityNames[cityNumber] || 'Неизвестный город';
}

function runMMAS() {
    const numAnts = 2400;
// альфа - приоритетность путей с феромонами, чем выше показатель - тем выше шанс, что муравей выберет путь с бОльшей концентрацией ферамона, позволяет отточить самый лучший маршрут, но приводит к "консерватизации"
    const alpha = 9.0;
// бета в формуле - это уровень лени муравья, чем выше значение - тем выше вероятность, что муравей выберет ближайший город, хорошо, при улучшении результатов, и плохо, что приводит к "консерватизации"
    const beta = 6.0;
// скорость испарения феромонов, по сути скорость исчезновения феромонов
    const evaporationRate = 0.2;
    const numIterations = 400;

    const mmas = new MMAS(distances, numAnts, alpha, beta, evaporationRate);
    mmas.run(numIterations);
}



const start = performance.now()
runMMAS();
console.log(performance.now() - start)

//Dmytro Ishchenko KH-41