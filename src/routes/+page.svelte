<script lang="ts">
	import { env } from '$env/dynamic/public';
</script>

<main>
	<h1>YggdrasilCloud Photo Manager</h1>
	<p>Welcome to YggdrasilCloud - A modern photo management application built with DDD architecture.</p>

	<div class="status">
		<h2>API Status</h2>
		<p>API URL: {env.PUBLIC_API_URL || 'Not configured'}</p>
	</div>

	<div class="features">
		<h2>Features</h2>
		<ul>
			<li>✅ Folder management</li>
			<li>✅ Photo upload with drag & drop</li>
			<li>✅ Virtual scrolling for large collections</li>
			<li>✅ Real-time upload progress</li>
			<li>🚧 EXIF metadata extraction (coming soon)</li>
			<li>🚧 Photo preview and gallery</li>
		</ul>
	</div>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		color: #333;
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.status,
	.features {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		margin-top: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	h2 {
		margin-top: 0;
		color: #555;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 0.5rem 0;
		font-size: 1.1rem;
	}
</style>
