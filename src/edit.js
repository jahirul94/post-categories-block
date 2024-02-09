import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import './editor.scss';
import { RawHTML } from '@wordpress/element';
import { format, dateI18n, __experimentalGetSettings } from '@wordpress/date';
import { PanelBody, ToggleControl, QueryControls, RangeControl } from "@wordpress/components";

export default function Edit({ attributes, setAttributes }) {
	const { numberOfPosts, displayFeaturedImage, order, orderBy, categories } = attributes;

	const catIDs = categories && categories.length > 0 ? categories.map(cat => cat.id) : [];

	const posts = useSelect(
		(select) => {
			return select('core').getEntityRecords('postType', 'post', {
				per_page: numberOfPosts,
				_embed: true,
				order,
				orderby: orderBy,
				categories:catIDs
			});
		},
		[numberOfPosts, order, orderBy , categories]
	);

	const allCats = useSelect(
		(select) => {
			return select('core').getEntityRecords('taxonomy', 'category', {
				per_page: -1,
			});
		},
		[]
	);

	const catSuggestions = {};
	if (allCats) {
		for (let i = 0; i < allCats.length; i++) {
			const cat = allCats[i];
			catSuggestions[cat.name] = cat;
		}
	}

	const onDisplayFeaturesImageChange = (value) => {
		setAttributes({ displayFeaturedImage: value });
	}
	const onNumberOfItemsChange = (value) => {
		setAttributes({ numberOfPosts: value });
	}
	const onCategoryChange = (values) => {
		const hasNoSuggestions = values.some((value) => typeof value === 'string' && !catSuggestions[value]);

		if (hasNoSuggestions) return;
		const updateCats = values.map((token) => {
			return typeof token === 'string' ? catSuggestions[token] : token;
		})
		setAttributes({ categories: updateCats });
	}

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<ToggleControl label={__('Display Features Image', 'latest-posts')} checked={displayFeaturedImage} onChange={onDisplayFeaturesImageChange} />
				</PanelBody>
				<QueryControls numberOfItems={numberOfPosts} onNumberOfItemsChange={onNumberOfItemsChange}
					maxItems={10}
					minItems={1}
					onOrderByChange={(value) => setAttributes({ orderBy: value })}
					orderBy={orderBy}
					order={order}
					onOrderChange={(value) => setAttributes({ order: value })}

					categorySuggestions={catSuggestions}
					selectedCategories={
						categories
					}
					selectedCategoryId={1}
					onCategoryChange={onCategoryChange}

				/>
			</InspectorControls>
			<ul {...useBlockProps()}>
				{posts &&
					posts.map((post) => {
						// check featuresImage is exists 
						const featuredImage = post._embedded && post._embedded['wp:featuredmedia'] &&
							post._embedded['wp:featuredmedia'].length > 0 && post._embedded['wp:featuredmedia'][0];

						return (
							<li key={post.id}>
								{displayFeaturedImage &&
									featuredImage && <img src={featuredImage.media_details.sizes.large.source_url} alt={featuredImage.alt_text} />}
								<h5>
									<a href={post.link}>
										{post.title.rendered ? (
											<RawHTML>
												{post.title.rendered}
											</RawHTML>
										) : (
											__('(No Title)', 'latest-posts')
										)}
									</a>
								</h5>
								{post.date_gmt && (
									<time dateTime={format('c', post.date_gmt)}>
										{dateI18n(
											__experimentalGetSettings().formats
												.date,
											post.date_gmt
										)}
									</time>
								)}
								{post.excerpt.rendered && <RawHTML>{post.excerpt.rendered}</RawHTML>}
							</li>
						);
					})}
			</ul>
		</>
	);
}
