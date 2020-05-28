import React from "react";
import Matrix from "./components/Matrix";
import "./sass/App.scss";

function App() {
	return (
		<div className="container">
			<Matrix />
			<p id="madeBy">
				<a href="https://github.com/tolgaerdonmez" target="_blank" rel="noopener noreferrer">
					Made by Tolga Erdönmez
				</a>
			</p>
		</div>
	);
}

export default App;
