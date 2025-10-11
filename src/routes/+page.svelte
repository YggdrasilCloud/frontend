<script lang="ts">
	import { env } from '$env/dynamic/public';
</script>

<main>
	<h1>YggdrasilCloud Dashboard</h1>
	<p>Welcome to YggdrasilCloud - A modern multi-plugin cloud management platform.</p>

	<div class="plugins">
		<h2>Available Plugins</h2>
		<div class="plugin-grid">
			<a href="/photos" class="plugin-card">
				<div class="plugin-icon">📸</div>
				<h3>Photo Manager</h3>
				<p>Organize and manage your photo collection with folders and albums.</p>
			</a>

			<div class="plugin-card disabled">
				<div class="plugin-icon">📄</div>
				<h3>Document Manager</h3>
				<p>Coming soon...</p>
			</div>

			<div class="plugin-card disabled">
				<div class="plugin-icon">🎵</div>
				<h3>Music Library</h3>
				<p>Coming soon...</p>
			</div>
		</div>
	</div>

	<div class="status">
		<h2>System Status</h2>
		<p>API URL: {env.PUBLIC_API_URL || 'Not configured'}</p>
	</div>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		color: var(--color-text);
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	main > p {
		color: var(--color-text-secondary);
		font-size: 1.1rem;
		margin-bottom: var(--spacing-xl);
	}

	.plugins,
	.status {
		background: var(--color-bg-alt);
		padding: var(--spacing-xl);
		border-radius: var(--radius-md);
		margin-top: var(--spacing-xl);
		box-shadow: var(--shadow-md);
	}

	h2 {
		margin-top: 0;
		color: var(--color-text);
		margin-bottom: var(--spacing-lg);
	}

	.plugin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--spacing-lg);
	}

	.plugin-card {
		background: var(--color-bg);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		text-decoration: none;
		color: var(--color-text);
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.plugin-card:not(.disabled):hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
		border-color: var(--color-primary);
	}

	.plugin-card.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.plugin-icon {
		font-size: 3rem;
		margin-bottom: var(--spacing-md);
	}

	.plugin-card h3 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text);
		font-size: 1.25rem;
	}

	.plugin-card p {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: 0.95rem;
	}

	.status p {
		color: var(--color-text-secondary);
		margin: 0;
	}
</style>
