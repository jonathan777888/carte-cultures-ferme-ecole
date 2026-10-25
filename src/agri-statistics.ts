/** Statistiques descriptives + regression ridge multivariable implementee sans bibliotheque ML.
 * Donnees d'exemple SYNTHETIQUES ; aucune precision agronomique revendiquee. */
export type Observation = { eau: number; temperature: number; rendement: number };
export const DEMO_SYNTHETIQUE: Observation[] = Array.from({length:48},(_,i)=>({
  eau: 12+(i%8)*3, temperature: 15+(Math.floor(i/8)%6)*2,
  rendement: 0.8+0.075*(12+(i%8)*3)+0.15*(15+(Math.floor(i/8)%6)*2)+((i*7)%5-2)*0.09,
}));
export function moyenne(xs: readonly number[]): number {
  if (!xs.length) throw new Error("serie vide");
  if (!xs.every(Number.isFinite)) throw new Error("serie non numerique");
  return xs.reduce((a,b)=>a+b,0)/xs.length;
}
export function variance(xs: readonly number[]): number {
  if(xs.length<2) throw new Error("au moins deux valeurs");
  const mu=moyenne(xs);
  return xs.reduce((s,x)=>s+(x-mu)**2,0)/(xs.length-1);
}
export function separerDonnees(data: readonly Observation[], ratio=0.75) {
  if (!(ratio>0 && ratio<1) || data.length<4) throw new Error("echantillon insuffisant");
  const n=Math.max(2,Math.min(data.length-2,Math.floor(data.length*ratio)));
  // Separation deterministe : jamais melanger entrainement et test.
  return {entrainement:data.slice(0,n),test:data.slice(n)};
}
function inversion3(a: number[][], b: number[]): number[] {
  const m=a.map((row,i)=>[...row,b[i]]);
  for(let j=0;j<3;j++){
    let pivot=j;
    for(let i=j+1;i<3;i++) if(Math.abs(m[i][j])>Math.abs(m[pivot][j])) pivot=i;
    if(Math.abs(m[pivot][j])<1e-11) throw new Error("matrice singuliere");
    [m[j],m[pivot]]=[m[pivot],m[j]];
    const div=m[j][j];
    for(let k=j;k<4;k++)m[j][k]/=div;
    for(let i=0;i<3;i++) if(i!==j){
      const facteur=m[i][j];
      for(let k=j;k<4;k++)m[i][k]-=facteur*m[j][k];
    }
  }
  return m.map(row=>row[3]);
}
export function entrainerRegression(data: readonly Observation[], penalite=0.01) {
  if(data.length<4 || penalite<0 || !Number.isFinite(penalite)) throw new Error("parametres invalides");
  for(const d of data) if(![d.eau,d.temperature,d.rendement].every(Number.isFinite))
    throw new Error("observation invalide");
  const x=data.map(d=>[1,d.eau/30,d.temperature/25]);
  const xtx=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>
    x.reduce((s,row)=>s+row[i]*row[j],0)+(i===j&&i>0?penalite:0)));
  const xty=Array.from({length:3},(_,i)=>x.reduce((s,row,k)=>s+row[i]*data[k].rendement,0));
  const coefficients=inversion3(xtx,xty);
  return {coefficients, predire:(eau:number,temperature:number)=>{
    if(!Number.isFinite(eau)||!Number.isFinite(temperature))throw new Error("entree invalide");
    return coefficients[0]+coefficients[1]*eau/30+coefficients[2]*temperature/25;
  }};
}
export function evaluerRegression(observations:readonly Observation[], predire:(e:number,t:number)=>number){
  if(!observations.length)throw new Error("jeu de test vide");
  const erreurs=observations.map(d=>d.rendement-predire(d.eau,d.temperature));
  return {
    mae:moyenne(erreurs.map(Math.abs)),
    rmse:Math.sqrt(moyenne(erreurs.map(e=>e*e))),
    biais:moyenne(erreurs),
    n:observations.length,
  };
}
