# DataWink

This repository contains the source code for [*DataWink: Reusing and Adapting SVG-based Visualizations with LMMs*](https://shellywhen.github.io/projects/DataWink) (IEEE VIS 2025).

![Teaser of DataWink: DataWink: Reusing and Adapting SVG-based Visualizations with LMMs (IEEE VIS 2025)](https://shellywhen.github.io/projects/DataWink/teaser.png)


## How to Run
The entire prototype is implemented in a React framework, with Node.js version 23.2.0.

```bash
git clone https://github.com/shellywhen/DataWink.git
cd DataWink
npm install
npm run dev
```
Then you should be seeing the deployed website (default at https://localhost:5173).

## How to Use
1. Configure your OpenAI API in the frontend.
2. Import your SVG example or try with examples.
3. Wait for LMM parsing (up to 10 minutes due to an unoptimized long chain) and enjoy your extensible template.


## Citation
```latex
@article{xie2025datawink,
    title = {{DataWink}: {R}eusing and Adapting {SVG}-based Visualizations with {LMM}s},
    author = {Liwenhan Xie and Yanna Lin and Can Liu and Huamin Qu and Xinhuan Shu},
    journal = {IEEE Transactions on Visualization and Computer Graphics},
    year = {2026},
    publisher = {IEEE},
    doi = {10.1109/TVCG.2025.3634635}
    volume = {32},
    number = {1},
    pages = {824--834}
}
```
