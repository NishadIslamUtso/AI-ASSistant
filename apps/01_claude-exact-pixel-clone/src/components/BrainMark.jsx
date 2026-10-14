import { useId } from 'react'

/**
 * BrainMark — the AI ASSistant logo ("Cheeky brain").
 *
 * The artwork is built from <use href="#…"> and clipPath references, so every id
 * is namespaced per instance. Two copies rendered on the same page (sidebar plus
 * settings, say) would otherwise resolve to the first one's defs and render wrong.
 */
export default function BrainMark({ size = 24, className = '', title = 'AI ASSistant' }) {
  const uid = useId().replace(/:/g, '')
  const body = `bm-body-${uid}`
  const bodyClip = `bm-body-clip-${uid}`
  const leftLens = `bm-left-lens-${uid}`
  const rightLens = `bm-right-lens-${uid}`
  const titleId = `bm-title-${uid}`
  const descId = `bm-desc-${uid}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 740 740"
      fill="none"
      className={className}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>
        A smiling pink cartoon brain shaped like a pair of butt cheeks, wearing oversized round black
        glasses and purple sneakers, giving a thumbs-up.
      </desc>

      <defs>
        <path
          id={body}
          d="M356 148 C322 120 281 112 242 120 C169 131 107 178 80 246 C40 344 59 438 119 482 C178 526 280 530 330 483 C341 473 351 459 356 447 C362 463 372 479 386 489 C440 531 529 518 580 471 C637 419 649 333 618 252 C593 185 540 137 476 122 C432 112 391 121 356 148Z"
        />
        <clipPath id={bodyClip}>
          <use href={`#${body}`} />
        </clipPath>
        <clipPath id={leftLens}>
          <circle cx="299" cy="280" r="67" />
        </clipPath>
        <clipPath id={rightLens}>
          <circle cx="470" cy="249" r="67" />
        </clipPath>
      </defs>

      {/* Legs and far arm sit behind the pink body. */}
      <g id="legs" stroke="#393A34" strokeWidth="23" strokeLinecap="round">
        <path d="M259 481 C267 514 260 548 250 574" />
        <path d="M418 480 C432 513 424 550 414 574" />
      </g>
      <g id="thumbs-up-arm">
        <path d="M578 357 C609 378 632 399 655 406" stroke="#373834" strokeWidth="22" strokeLinecap="round" />
        <path
          d="M645 397 C650 389 659 384 668 383 C677 381 685 384 683 391 L679 398 C692 407 697 418 692 430 C687 442 675 447 662 443 C649 440 642 431 640 419 L636 411Z"
          fill="#373834"
          stroke="#282A28"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>

      {/* Two generously rounded cheeks, with a central cleft. */}
      <g id="butt-shaped-brain">
        <use href={`#${body}`} fill="#FF99A5" />
        <g clipPath={`url(#${bodyClip})`}>
          <use href={`#${body}`} transform="translate(0 -12)" fill="#FFAFB8" />
          <path d="M356 148 C338 172 333 198 342 234" stroke="#F27F89" strokeWidth="10" strokeLinecap="round" />
          <path d="M366 366 C380 389 376 420 356 447" stroke="#EE7B87" strokeWidth="11" strokeLinecap="round" />
          <path d="M357 366 C368 393 365 418 350 438" stroke="#FFA0AC" strokeWidth="5" strokeLinecap="round" />

          {/* A few brain folds keep the original character recognizable. */}
          <g id="brain-folds" stroke="#F08089" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M233 181 C205 176 185 184 174 205 C167 219 165 231 165 239 C146 231 128 243 122 260 C117 274 120 288 123 296 C106 304 100 319 100 334" />
            <path d="M446 168 C468 162 489 173 496 191" />
            <path d="M111 384 C99 400 106 419 119 429" />
            <path d="M144 443 C157 450 174 453 188 451" />
            <path d="M585 338 C597 355 588 375 574 383 C579 402 557 421 530 421" />
          </g>
          <path d="M203 472 C235 483 277 475 298 456" stroke="#FFA0AA" strokeWidth="8" strokeLinecap="round" />
          <path d="M417 460 C444 481 483 480 508 466" stroke="#FFA0AA" strokeWidth="8" strokeLinecap="round" />
        </g>
      </g>

      {/* Warm blush on each cheek. */}
      <g id="blush" fill="#FF939F">
        <ellipse cx="218" cy="364" rx="34" ry="19" transform="rotate(-6 218 364)" />
        <ellipse cx="521" cy="352" rx="34" ry="19" transform="rotate(5 521 352)" />
      </g>

      <g id="glasses">
        <g id="frame-connectors" stroke="#242725" strokeLinecap="round">
          <path d="M229 288 L184 300" strokeWidth="18" />
          <path d="M370 267 C381 262 390 261 399 260" strokeWidth="11" />
        </g>
        <g id="lenses" fill="#DECBDE">
          <circle cx="299" cy="280" r="69" />
          <circle cx="470" cy="249" r="69" />
        </g>
        <g id="eyes" fill="#9099A2">
          <ellipse cx="294" cy="287" rx="19.5" ry="27.5" />
          <ellipse cx="472" cy="262" rx="20" ry="28" />
          <path d="M281 232 C289 224 300 224 309 229" stroke="#9099A2" strokeWidth="10" strokeLinecap="round" />
          <path d="M451 207 C459 198 470 198 478 203" stroke="#9099A2" strokeWidth="10" strokeLinecap="round" />
        </g>
        <g id="lens-reflections" fill="#FFFFFF" opacity="0.94">
          <path d="M308 205 L324 210 L251 341 L235 331Z" clipPath={`url(#${leftLens})`} />
          <path d="M466 174 L483 179 L414 306 L400 296Z" clipPath={`url(#${rightLens})`} />
        </g>
        <g id="round-frames" stroke="#242725" strokeWidth="15.5">
          <circle cx="299" cy="280" r="71" />
          <circle cx="470" cy="249" r="71" />
        </g>
      </g>

      <path id="smile" d="M374 325 C378 343 399 345 406 325" stroke="#384638" strokeWidth="7" strokeLinecap="round" />

      <g id="near-arm">
        <path d="M151 358 C139 385 127 419 120 461" stroke="#393A35" strokeWidth="21" strokeLinecap="round" />
        <path
          d="M120 450 C109 451 99 458 94 471 C87 487 94 502 107 508 C120 515 135 507 139 494 L142 486 C149 491 156 487 152 479 C149 467 135 453 120 450Z"
          fill="#393A35"
          stroke="#2B2D29"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>

      <g id="purple-sneakers">
        <g id="left-shoe">
          <path d="M232 570 L270 570 L270 592 L227 592Z" fill="#F2EFF8" />
          <path
            d="M228 583 C239 588 256 589 270 582 C287 582 309 596 322 611 C330 620 334 630 331 636 C305 647 252 647 225 638 C214 634 216 623 220 608Z"
            fill="#9473B0"
          />
          <path d="M219 622 C244 635 299 639 333 628 L332 637 C328 646 292 648 262 646 C236 645 216 640 219 622Z" fill="#383333" />
          <path d="M294 590 C287 596 281 602 278 608" stroke="#F5F2F9" strokeWidth="8" strokeLinecap="round" />
        </g>
        <g id="right-shoe">
          <path d="M396 570 L434 570 L434 592 L391 592Z" fill="#F2EFF8" />
          <path
            d="M392 583 C404 588 421 589 435 582 C452 583 474 596 487 612 C495 621 499 631 496 637 C470 647 417 647 390 638 C379 634 381 623 385 608Z"
            fill="#9473B0"
          />
          <path d="M384 622 C409 635 464 639 498 628 L497 637 C493 646 457 648 427 646 C401 645 381 640 384 622Z" fill="#383333" />
          <path d="M459 590 C452 596 446 602 443 608" stroke="#F5F2F9" strokeWidth="8" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}
