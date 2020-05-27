import React, { useState, useEffect } from "react";
import "../sass/Timer.scss";

interface Props {
	onFinish: () => void;
}

const Timer = ({ onFinish }: Props) => {
	const [count, setCount] = useState(3);
	useEffect(() => {
		if (count === 0) {
			console.log("finished");
			onFinish();
		} else {
			setTimeout(() => {
				setCount(count - 1);
				console.log("counting");
			}, 1000);
		}
	}, [count, onFinish]);
	return <h1 className="timer">{count}</h1>;
};

export default Timer;
