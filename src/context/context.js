import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext('default');

const GithubProvider = ({ children }) => {
	const [githubUser, setGithubUser] = useState(mockUser);
	const [repos, setRepos] = useState(mockRepos);
	const [followers, setFollowers] = useState(mockFollowers);

	// request loading
	const [request, setRequests] = useState(0);
	const [loading, SetIsLoading] = useState(false);
	// error
	const [error, setError] = useState({ show: false, msg: '' });

	// serach user
	const searchGithubUser = async (user) => {
		toggleError();
		SetIsLoading(true);
		const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
			console.log(err)
		);
		if (response) {
			const { login, followers_url } = response.data;

			// repos
			// https://api.github.com/users/john-smilga/repos?per_page=100
			// followrs
			//https://api.github.com/users/john-smilga/followers
			setGithubUser(response.data);
			await Promise.allSettled([
				axios(`${rootUrl}/users/${login}/repos?per_page=100`),
				axios(`${followers_url}?per_page=100`),
			])
				.then((results) => {
					const [repos, followers] = results;
					const status = 'fulfilled';
					if (repos.status == status) {
						setRepos(repos.value.data);
					}
					if (repos.followers == status) {
						setFollowers(followers.value.data);
					}

					console.log(results);
				})
				.catch((error) => console.log(error));
		} else {
			toggleError(true, 'no user matches such username');
		}
		checkRequest();
		SetIsLoading(false);
	};
	// check rate
	const checkRequest = () => {
		axios(`${rootUrl}/rate_limit`)
			.then(({ data }) => {
				let {
					rate: { remaining },
				} = data;
				setRequests(remaining);
				console.log(remaining);
				if (remaining == 0) {
					toggleError(true, 'sorry you have exceede your hourly rate limit');
				}
			})
			.catch((err) => console.log(err));
	};
	function toggleError(show = false, msg = '') {
		setError({ show, msg });
	}
	useEffect(checkRequest, []);

	return (
		<GithubContext.Provider
			value={{
				githubUser,
				repos,
				followers,
				request,
				error,
				searchGithubUser,
				loading,
			}}
		>
			{children}
		</GithubContext.Provider>
	);
};
export { GithubProvider, GithubContext };
