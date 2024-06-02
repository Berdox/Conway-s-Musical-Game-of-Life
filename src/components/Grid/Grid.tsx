import React, { useState, useEffect } from 'react';
import "./Grid.css"
import {SynthNote, changeSynth, keys} from '../Synth/SynthFunc';
import volumeImg from '../../assets/volume_icons/sound.png'; // Replace with the correct path to your volume image
import mutedImg from '../../assets/volume_icons/mute.png';  // Replace with the correct path to your muted image

interface GridIndex {
    first: number;
    second: number;
}
  
enum NotePlayType {
    ALL_NOTES,
    NEW_NOTES,
    NO_REPEAT_NOTES,
    NO_REPEAT_NEW_NOTES,
}

export enum SynthType {
    SYNTH,
    AMSYNTH,
    FMSYNTH,
    MEMBRANESYNTH,
    METALSYNTH,
    PIANO,
}

const rowNumber = 53;
const colNumber = 36;

const initialGrid: boolean[][] = Array.from({ length: rowNumber }, () => Array(colNumber).fill(false));
let musicGrid: GridIndex[] = [];

const Grid: React.FC = () => {
    const [noteType, setNoteType] = useState<NotePlayType>(NotePlayType.NO_REPEAT_NEW_NOTES);
    const [synthType, setSynthType] = useState<SynthType>(SynthType.SYNTH);
    const [volume, setVolume] = useState<number>(1);
    const [isMuted, setMuted] = useState<boolean>(false);
    const [grid, setGrid] = useState<boolean[][]>(initialGrid);
    const [genCount, setGenCount] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    function updateClickedGrid(i: number, j: number) {
        const newGrid = grid.map((row, rowIndex) =>
            row.map((col, colIndex) =>
                (rowIndex === i && colIndex === j ? !col : col)));

        setGrid(newGrid);
    }

    function startSim() {
        const newGrid = Array.from({ length: rowNumber }, () => Array(colNumber).fill(false));
        let playedNotes = new Set<string>();

        for (let i = 0; i < rowNumber; i++) {
            for (let j = 0; j < colNumber; j++) {
                let neighbors = 0;
                const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

                for (let k = 0; k < directions.length; k++) {
                    const newI = (i + directions[k][0] + rowNumber) % rowNumber;
                    const newJ = (j + directions[k][1] + colNumber) % colNumber;

                    if (grid[newI][newJ]) {
                        neighbors++;
                    }
                }

                if (grid[i][j] && (neighbors === 2 || neighbors === 3)) {
                    newGrid[i][j] = true;
                    musicGrid.push({ first: i, second: j });
                } else if (!grid[i][j] && neighbors === 3) {
                    newGrid[i][j] = true;
                    musicGrid.push({ first: i, second: j });
                } else {
                    newGrid[i][j] = false;
                }
            }
        }

        if (musicGrid.length > 0) {
            console.log("New notes")
            if(noteType === NotePlayType.ALL_NOTES) {
                musicGrid.map((row) =>  {
                    SynthNote(keys[row.first + row.second].note, volume);
                })
            } else if(noteType === NotePlayType.NEW_NOTES) {
                musicGrid.map((row) =>  {
                    if(grid[row.first][row.second] === false) {
                    SynthNote(keys[row.first + row.second].note, volume);
                    }
                })
            } else if(noteType === NotePlayType.NO_REPEAT_NOTES) {
                musicGrid.map((row) => {
                    const note = keys[row.first + row.second].note;
                    if(!playedNotes.has(note)) {
                        SynthNote(note, volume);
                        playedNotes.add(note);
                    }
                })
            } else if(noteType === NotePlayType.NO_REPEAT_NEW_NOTES) {
                musicGrid.map((row) => {
                    if(grid[row.first][row.second] === false) {
                        const note = keys[row.first + row.second].note;
                        if(!playedNotes.has(note)) {
                            SynthNote(note, volume);
                            playedNotes.add(note);
                        }
                    }
                })
            } 
            musicGrid.length = 0;  // Clear the musicGrid after processing
        }

        setGrid(newGrid);
        setGenCount(genCount => genCount + 1);
    }

    function resetGrid() {
        const newGrid = Array.from({ length: rowNumber },
            () => Array(colNumber).fill(false));
        setGrid(newGrid);
        setGenCount(0);
        setIsRunning(false);
    }

    const toggleMute = () => {
        setMuted(!isMuted);
        setVolume(0);
    }

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(!isMuted) {
            setVolume(Number(event.target.value));
        } else {
            setVolume(0);
        }
    };

    const handleNoteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setNoteType(Number(event.target.value) as NotePlayType);
    };

    const handleSynthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        changeSynth(Number(event.target.value) as SynthType);
        setSynthType(Number(event.target.value) as SynthType);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (isRunning) {
            interval = setInterval(() => {
                startSim();
            }, 250);
        } else if (interval) {
            clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, grid, volume]);

    return (
        <div className='game_container'>
            <div className='grid_and_control'>
                <div className='grid_container'>
                    {grid.map((rows, i) =>
                        rows.map((col, j) => (
                            <div key={`${i}-${j}`}
                                className={col ? 'cell cell_alive' : 'cell cell_dead'}
                                onClick={() => updateClickedGrid(i, j)}>
                                <p className={col ? 'note_name cell_alive' : 'note_name cell_dead'}>
                                    {keys[i + j].note}
                                </p>
                            </div>)
                        )
                    )}
                </div>
                <div className='control_buttons'>
                    <button className='button lightText large square black start_button' onClick={() => setIsRunning(!isRunning)}>
                        {isRunning ? "Stop" : "Start"}
                    </button>
                    <button className='button lightText large square black reset_button' onClick={resetGrid}>Reset</button>
                    <h2 className='generation_count'>Generations: {genCount}</h2>
                </div>
                <div className='volume_container'>
                <img
                    className='volume_image'
                    src={isMuted ? mutedImg : volumeImg}
                    alt="Volume Control"
                    onClick={toggleMute}
                />
                    <input
                        type="range"
                        id="volume"
                        name="volume"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                    />
                </div>
            </div>
            <div className='dropdown_container'>
                <div className='note_type'>
                    <h2>Note Play Type</h2>
                    <select className='select-dropdown black' value={noteType} onChange={handleNoteChange}>
                        <option value={NotePlayType.NO_REPEAT_NEW_NOTES}>No Repeating & New Notes</option>
                        <option value={NotePlayType.NO_REPEAT_NOTES}>No Repeating Notes</option>
                        <option value={NotePlayType.NEW_NOTES}>New Notes</option>
                        <option value={NotePlayType.ALL_NOTES}>All Notes</option>
                    </select>
                    <ul>
                        <li><strong>No Repeating & New Notes:</strong> Plays only the newly created alive cells (white ones) from this generation, 
                        ensuring each note is played just once. For example, if there are two C4 notes alive at the same time, 
                        only one will be played.</li>

                        <li><strong>No Repeating Notes:</strong> Plays each note only once, even if it appears multiple times. For example, 
                        if there are two C4 notes alive at the same time, only one will be played.</li>

                        <li><strong>New Notes:</strong> Plays only the newly created alive cells (white ones) from this generation.</li>
                        
                        <li><strong>All Notes:</strong> Plays all the alive cells. (Warning: it might sound quite chaotic.)</li>
                    </ul>

                </div>
                <div className='synth_type'>
                    <h2>Synth Types</h2>
                    <select className='select-dropdown black' value={synthType} onChange={handleSynthChange}>
                        <option value={SynthType.SYNTH}>Synth</option>
                        <option value={SynthType.AMSYNTH}>AM Synth</option>
                        <option value={SynthType.FMSYNTH}>FM Synth</option>
                        <option value={SynthType.MEMBRANESYNTH}>Membrane Synth</option>
                        <option value={SynthType.METALSYNTH}>Metal Synth</option>
                    </select>
                    <ul>
                    <li>Synth</li>
                    <li>AM Synth</li>
                    <li>FM Synth</li>
                    <li>Membrane Synth</li>
                    <li>Metal Synth</li>
                    </ul>
                </div>
            </div>
            <div className='github_container'>
                <h2>Github</h2>
                <a href="https://github.com/Berdox/Conways-Musical-Game-of-Life/tree/main" >https://github.com/Berdox/Conways-Musical-Game-of-Life/tree/main</a>
            </div>
        </div>
    );
};
//                <option value={SynthType.PIANO}>Piano</option>

export default Grid;