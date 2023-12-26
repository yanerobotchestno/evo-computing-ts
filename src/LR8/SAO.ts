

function matyasFunction(x: number[]): number {
    return 0.26 * (x[0] ** 2 + x[1] ** 2) - 0.48 * x[0] * x[1];
}

function schaffer2(x: number[]): number {
    const fact1: number = Math.pow(Math.sin(x[0] ** 2 - x[1] ** 2), 2) - 0.5;
    const fact2: number = Math.pow(1 + 0.001 * (x[0] ** 2 + x[1] ** 2), 2);

    return 0.5 + fact1 / fact2;
}


function bukin6(x: number[]): number {
    const term1: number = 100 * Math.sqrt(Math.abs(x[1] - 0.01 * x[0] ** 2));
    const term2: number = 0.01 * Math.abs(x[0] + 10);

    return term1 + term2;
}

function transform(old: number[]): number[] {
    let newVals = [...old];
    if (Math.random() < 0.1) {
        const num = Math.floor(Math.random() * newVals.length);
        for (let i = 0; i < num; i++) {
            const index = Math.floor(Math.random() * newVals.length);
            newVals[index] += (Math.random() * 0.0002 - 0.0001);
        }
    } else {
        newVals = newVals.map(v => v + Math.random() - 0.5);
    }
    return newVals;
}

function decreaseTemperature(t: number, e: number): number {
    return t - 1 / e;
}

function simulatedAnnealingOptimization(func: (args: number[]) => number | null,
                                        dimensions: number,
                                        bounds: [number, number],
                                        tMin: number,
                                        tMax: number): [number[], number | null] {
    let xCurrent = Array.from({ length: dimensions }, () => Math.random() * (bounds[1] - bounds[0]) + bounds[0]);
    let eCurrent = func(xCurrent);
    let tCurrent = tMax;

    let xBest = xCurrent;
    let eBest = eCurrent;
    while (tCurrent > tMin && eCurrent !== null) {
        let xCandidate = transform(xCurrent);
        xCandidate = xCandidate.map(v => Math.min(Math.max(v, bounds[0]), bounds[1]));
        let eCandidate = func(xCandidate);
        if (eCandidate !== null) {
            const diff = eCandidate - eCurrent;
            if (eCandidate < eCurrent) {
                xCurrent = xCandidate;
                eCurrent = eCandidate;
            } else if (Math.random() < Math.exp(-diff / tCurrent)) {
                xCurrent = xCandidate;
                eCurrent = eCandidate;
            }
            tCurrent = decreaseTemperature(tCurrent, Math.abs(eCurrent));
            if (eBest === null || eBest > eCurrent) {
                xBest = xCurrent;
                eBest = eCurrent;
                console.log(eBest);
            }
        }
    }
    return [xBest, eBest];
}

const stds =performance.now()
console.log(simulatedAnnealingOptimization(schaffer2, 2, [-15, 15], 1e-6, 1e6));

console.log(performance.now() - stds);