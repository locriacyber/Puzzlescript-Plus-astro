/** Legacy PuzzlescriptPlus code. All in 1 file. */

import { savePlainTextFile } from './lib/save-file'

// @@begin js/jsgif/LZWEncoder.js
/**
* This class handles LZW encoding
* Adapted from Jef Poskanzer's Java port by way of J. M. G. Elliott.
* @author Kevin Weiner (original Java version - kweiner@fmsware.com)
* @author Thibault Imbert (AS3 version - bytearray.org)
* @version 0.1 AS3 implementation
*/

	//import flash.utils.ByteArray;
	
	const LZWEncoder = function()
	{
	    var exports = {};
		/*private_static*/ var EOF/*int*/ = -1;
		/*private*/ var imgW/*int*/;
		/*private*/ var imgH/*int*/
		/*private*/ var pixAry/*ByteArray*/;
		/*private*/ var initCodeSize/*int*/;
		/*private*/ var remaining/*int*/;
		/*private*/ var curPixel/*int*/;
		
		// GIFCOMPR.C - GIF Image compression routines
		// Lempel-Ziv compression based on 'compress'. GIF modifications by
		// David Rowley (mgardi@watdcsu.waterloo.edu)
		// General DEFINEs
		
		/*private_static*/ var BITS/*int*/ = 12;
		/*private_static*/ var HSIZE/*int*/ = 5003; // 80% occupancy
		
		// GIF Image compression - modified 'compress'
		// Based on: compress.c - File compression ala IEEE Computer, June 1984.
		// By Authors: Spencer W. Thomas (decvax!harpo!utah-cs!utah-gr!thomas)
		// Jim McKie (decvax!mcvax!jim)
		// Steve Davies (decvax!vax135!petsd!peora!srd)
		// Ken Turkowski (decvax!decwrl!turtlevax!ken)
		// James A. Woods (decvax!ihnp4!ames!jaw)
		// Joe Orost (decvax!vax135!petsd!joe)
		
		/*private*/ var n_bits/*int*/ // number of bits/code
		/*private*/ var maxbits/*int*/ = BITS; // user settable max # bits/code
		/*private*/ var maxcode/*int*/ // maximum code, given n_bits
		/*private*/ var maxmaxcode/*int*/ = 1 << BITS; // should NEVER generate this code
		/*private*/ var htab/*Array*/ = new Array;
		/*private*/ var codetab/*Array*/ = new Array;
		/*private*/ var hsize/*int*/ = HSIZE; // for dynamic table sizing
		/*private*/ var free_ent/*int*/ = 0; // first unused entry
		
		// block compression parameters -- after all codes are used up,
		// and compression rate changes, start over.
		
		/*private*/ var clear_flg/*Boolean*/ = false;
		
		// Algorithm: use open addressing double hashing (no chaining) on the
		// prefix code / next character combination. We do a variant of Knuth's
		// algorithm D (vol. 3, sec. 6.4) along with G. Knott's relatively-prime
		// secondary probe. Here, the modular division first probe is gives way
		// to a faster exclusive-or manipulation. Also do block compression with
		// an adaptive reset, whereby the code table is cleared when the compression
		// ratio decreases, but after the table fills. The variable-length output
		// codes are re-sized at this point, and a special CLEAR code is generated
		// for the decompressor. Late addition: construct the table according to
		// file size for noticeable speed improvement on small files. Please direct
		// questions about this implementation to ames!jaw.
		
		/*private*/ var g_init_bits/*int*/;
		/*private*/ var ClearCode/*int*/;
		/*private*/ var EOFCode/*int*/;
		
		// output
		// Output the given code.
		// Inputs:
		// code: A n_bits-bit integer. If == -1, then EOF. This assumes
		// that n_bits =< wordsize - 1.
		// Outputs:
		// Outputs code to the file.
		// Assumptions:
		// Chars are 8 bits long.
		// Algorithm:
		// Maintain a BITS character long buffer (so that 8 codes will
		// fit in it exactly). Use the VAX insv instruction to insert each
		// code in turn. When the buffer fills up empty it and start over.
		
		/*private*/ var cur_accum/*int*/ = 0;
		/*private*/ var cur_bits/*int*/ = 0;
		/*private*/ var masks/*Array*/ = [ 0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F, 0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF, 0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF ];
		
		// Number of characters so far in this 'packet'
		/*private*/ var a_count/*int*/;
		
		// Define the storage for the packet accumulator
		/*private*/ var accum/*ByteArray*/ = [];
		
		var LZWEncoder = exports.LZWEncoder = function LZWEncoder (width/*int*/, height/*int*/, pixels/*ByteArray*/, color_depth/*int*/)
		{
			
			imgW = width;
			imgH = height;
			pixAry = pixels;
			initCodeSize = Math.max(2, color_depth);
			
		}
		
		// Add a character to the end of the current packet, and if it is 254
		// characters, flush the packet to disk.
		var char_out = function char_out(c/*Number*/, outs/*ByteArray*/)/*void*/
		{
			accum[a_count++] = c;
			if (a_count >= 254) flush_char(outs);
			
		}
		
		// Clear out the hash table
		// table clear for block compress
		
		var cl_block = function cl_block(outs/*ByteArray*/)/*void*/
		{
			
			cl_hash(hsize);
			free_ent = ClearCode + 2;
			clear_flg = true;
			output(ClearCode, outs);
			
		}
		
		// reset code table
		var cl_hash = function cl_hash(hsize/*int*/)/*void*/
		{
			
			for (var i/*int*/ = 0; i < hsize; ++i) htab[i] = -1;
			
		}
		
		var compress = exports.compress = function compress(init_bits/*int*/, outs/*ByteArray*/)/*void*/
		
		{
			var fcode/*int*/;
			var i/*int*/ /* = 0 */;
			var c/*int*/;
			var ent/*int*/;
			var disp/*int*/;
			var hsize_reg/*int*/;
			var hshift/*int*/;
			
			// Set up the globals: g_init_bits - initial number of bits
			g_init_bits = init_bits;
			
			// Set up the necessary values
			clear_flg = false;
			n_bits = g_init_bits;
			maxcode = MAXCODE(n_bits);
	
			ClearCode = 1 << (init_bits - 1);
			EOFCode = ClearCode + 1;
			free_ent = ClearCode + 2;
	
			a_count = 0; // clear packet
		
			ent = nextPixel();
	
			hshift = 0;
			for (fcode = hsize; fcode < 65536; fcode *= 2)
			  ++hshift;
			hshift = 8 - hshift; // set hash code range bound
	
			hsize_reg = hsize;
			cl_hash(hsize_reg); // clear hash table
		
			output(ClearCode, outs);
		
			outer_loop: while ((c = nextPixel()) != EOF)
			
			{
				
				fcode = (c << maxbits) + ent;
				i = (c << hshift) ^ ent; // xor hashing
	
				if (htab[i] == fcode)
				{
				ent = codetab[i];
				continue;
				} else if (htab[i] >= 0) // non-empty slot
				{
					disp = hsize_reg - i; // secondary hash (after G. Knott)
					if (i == 0)
					disp = 1;
					do 
					{
						
						if ((i -= disp) < 0) i += hsize_reg;
	
						if (htab[i] == fcode)
						{
						ent = codetab[i];
						continue outer_loop;
						}
					} while (htab[i] >= 0);
				}
	      
				output(ent, outs);
				ent = c;
				if (free_ent < maxmaxcode)
				{
					codetab[i] = free_ent++; // code -> hashtable
					htab[i] = fcode;
				} else cl_block(outs);
			}
			
			// Put out the final code.
			output(ent, outs);
			output(EOFCode, outs);
			
		}
		
		// ----------------------------------------------------------------------------
		var encode = exports.encode = function encode(os/*ByteArray*/)/*void*/
		{
			os.writeByte(initCodeSize); // write "initial code size" byte
			remaining = imgW * imgH; // reset navigation variables
			curPixel = 0;
			compress(initCodeSize + 1, os); // compress and write the pixel data
			os.writeByte(0); // write block terminator
			
		}
		
		// Flush the packet to disk, and reset the accumulator
		var flush_char = function flush_char(outs/*ByteArray*/)/*void*/
		{
			
			if (a_count > 0)
			{
				outs.writeByte(a_count);
				outs.writeBytes(accum, 0, a_count);
				a_count = 0;
			}
			
		}
		
		var MAXCODE = function MAXCODE(n_bits/*int*/)/*int*/
		{
			
			return (1 << n_bits) - 1;
			
		}
		
		// ----------------------------------------------------------------------------
		// Return the next pixel from the image
		// ----------------------------------------------------------------------------
		
		var nextPixel = function nextPixel()/*int*/
		{
			
			if (remaining == 0) return EOF;
			
			--remaining;
			
			var pix/*Number*/ = pixAry[curPixel++];
			
			return pix & 0xff;
			
		}
		
		var output = function output(code/*int*/, outs/*ByteArray*/)/*void*/
		
		{
			cur_accum &= masks[cur_bits];
			
			if (cur_bits > 0) cur_accum |= (code << cur_bits);
			else cur_accum = code;
			
			cur_bits += n_bits;
			
			while (cur_bits >= 8)
			
			{
				
				char_out((cur_accum & 0xff), outs);
				cur_accum >>= 8;
				cur_bits -= 8;
				
			}
			
			// If the next entry is going to be too big for the code size,
			// then increase it, if possible.
			
			if (free_ent > maxcode || clear_flg)
			{
				
				if (clear_flg)
				{
					
					maxcode = MAXCODE(n_bits = g_init_bits);
					clear_flg = false;
					
				} else
				{
					
					++n_bits;
					
					if (n_bits == maxbits) maxcode = maxmaxcode;
					
					else maxcode = MAXCODE(n_bits);
					
				}
				
			}
			
			if (code == EOFCode) 
			{
				
				// At EOF, write the rest of the buffer.
				while (cur_bits > 0) 
				{
					
					char_out((cur_accum & 0xff), outs);
					cur_accum >>= 8;
					cur_bits -= 8;
				}
				
				
				flush_char(outs);
				
			}
			
		}
		LZWEncoder.apply(this, arguments);
	   return exports;
	}
	

// @@end js/jsgif/LZWEncoder.js


// @@begin js/jsgif/NeuQuant.js
/*
* NeuQuant Neural-Net Quantization Algorithm
* ------------------------------------------
* 
* Copyright (c) 1994 Anthony Dekker
* 
* NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994. See
* "Kohonen neural networks for optimal colour quantization" in "Network:
* Computation in Neural Systems" Vol. 5 (1994) pp 351-367. for a discussion of
* the algorithm.
* 
* Any party obtaining a copy of these files from the author, directly or
* indirectly, is granted, free of charge, a full and unrestricted irrevocable,
* world-wide, paid up, royalty-free, nonexclusive right and license to deal in
* this software and documentation files (the "Software"), including without
* limitation the rights to use, copy, modify, merge, publish, distribute,
* sublicense, and/or sell copies of the Software, and to permit persons who
* receive copies from any such party to do so, with the only requirement being
* that this copyright notice remain intact.
*/
 
/**
* This class handles Neural-Net quantization algorithm
* @author Kevin Weiner (original Java version - kweiner@fmsware.com)
* @author Thibault Imbert (AS3 version - bytearray.org)
* @version 0.1 AS3 implementation
*/

	//import flash.utils.ByteArray;
	
	const NeuQuant = function()
	{
	    var exports = {};
		/*private_static*/ var netsize/*int*/ = 256; /* number of colours used */
		
		/* four primes near 500 - assume no image has a length so large */
		/* that it is divisible by all four primes */
		
		/*private_static*/ var prime1/*int*/ = 499;
		/*private_static*/ var prime2/*int*/ = 491;
		/*private_static*/ var prime3/*int*/ = 487;
		/*private_static*/ var prime4/*int*/ = 503;
		/*private_static*/ var minpicturebytes/*int*/ = (3 * prime4);
		
		/* minimum size for input image */
		/*
		* Program Skeleton ---------------- [select samplefac in range 1..30] [read
		* image from input file] pic = (unsigned char*) malloc(3*width*height);
		* initnet(pic,3*width*height,samplefac); learn(); unbiasnet(); [write output
		* image header, using writecolourmap(f)] inxbuild(); write output image using
		* inxsearch(b,g,r)
		*/

		/*
		* Network Definitions -------------------
		*/
		
		/*private_static*/ var maxnetpos/*int*/ = (netsize - 1);
		/*private_static*/ var netbiasshift/*int*/ = 4; /* bias for colour values */
		/*private_static*/ var ncycles/*int*/ = 100; /* no. of learning cycles */
		
		/* defs for freq and bias */
		/*private_static*/ var intbiasshift/*int*/ = 16; /* bias for fractions */
		/*private_static*/ var intbias/*int*/ = (1 << intbiasshift);
		/*private_static*/ var gammashift/*int*/ = 10; /* gamma = 1024 */
		/*private_static*/ var gamma/*int*/ = (1 << gammashift);
		/*private_static*/ var betashift/*int*/ = 10;
		/*private_static*/ var beta/*int*/ = (intbias >> betashift); /* beta = 1/1024 */
		/*private_static*/ var betagamma/*int*/ = (intbias << (gammashift - betashift));
		
		/* defs for decreasing radius factor */
		/*private_static*/ var initrad/*int*/ = (netsize >> 3); /*
	                                                         * for 256 cols, radius
	                                                         * starts
	                                                         */
															 
		/*private_static*/ var radiusbiasshift/*int*/ = 6; /* at 32.0 biased by 6 bits */
		/*private_static*/ var radiusbias/*int*/ = (1 << radiusbiasshift);
		/*private_static*/ var initradius/*int*/ = (initrad * radiusbias); /*
	                                                                   * and
	                                                                   * decreases
	                                                                   * by a
	                                                                   */
																	   
		/*private_static*/ var radiusdec/*int*/ = 30; /* factor of 1/30 each cycle */
		
		/* defs for decreasing alpha factor */
		/*private_static*/ var alphabiasshift/*int*/ = 10; /* alpha starts at 1.0 */
		/*private_static*/ var initalpha/*int*/ = (1 << alphabiasshift);
		/*private*/ var alphadec/*int*/ /* biased by 10 bits */
		
		/* radbias and alpharadbias used for radpower calculation */
		/*private_static*/ var radbiasshift/*int*/ = 8;
		/*private_static*/ var radbias/*int*/ = (1 << radbiasshift);
		/*private_static*/ var alpharadbshift/*int*/ = (alphabiasshift + radbiasshift);
		
		/*private_static*/ var alpharadbias/*int*/ = (1 << alpharadbshift);
		
		/*
		* Types and Global Variables --------------------------
		*/
		
		/*private*/ var thepicture/*ByteArray*//* the input image itself */
		/*private*/ var lengthcount/*int*/; /* lengthcount = H*W*3 */
		/*private*/ var samplefac/*int*/; /* sampling factor 1..30 */
		
		// typedef int pixel[4]; /* BGRc */
		/*private*/ var network/*Array*/; /* the network itself - [netsize][4] */
		/*protected*/ var netindex/*Array*/ = new Array();
		
		/* for network lookup - really 256 */
		/*private*/ var bias/*Array*/ = new Array();
		
		/* bias and freq arrays for learning */
		/*private*/ var freq/*Array*/ = new Array();
		/*private*/ var radpower/*Array*/ = new Array();
		
		var NeuQuant = exports.NeuQuant = function NeuQuant(thepic/*ByteArray*/, len/*int*/, sample/*int*/)
		{
			
			var i/*int*/;
			var p/*Array*/;
			
			thepicture = thepic;
			lengthcount = len;
			samplefac = sample;
			
			network = new Array(netsize);
			
			for (i = 0; i < netsize; i++)
			{
				
				network[i] = new Array(4);
				p = network[i];
				p[0] = p[1] = p[2] = (i << (netbiasshift + 8)) / netsize;
				freq[i] = intbias / netsize; /* 1/netsize */
				bias[i] = 0;
			}
			
		}
		
		var colorMap = function colorMap()/*ByteArray*/
		{
			
			var map/*ByteArray*/ = [];
		    var index/*Array*/ = new Array(netsize);
		    for (var i/*int*/ = 0; i < netsize; i++)
		      index[network[i][3]] = i;
		    var k/*int*/ = 0;
		    for (var l/*int*/ = 0; l < netsize; l++) {
		      var j/*int*/ = index[l];
		      map[k++] = (network[j][0]);
		      map[k++] = (network[j][1]);
		      map[k++] = (network[j][2]);
		    }
		    return map;
			
		}
		
		/*
	   * Insertion sort of network and building of netindex[0..255] (to do after
	   * unbias)
	   * -------------------------------------------------------------------------------
	   */
	   
	   var inxbuild = function inxbuild()/*void*/
	   {
		   
		  var i/*int*/;
		  var j/*int*/;
		  var smallpos/*int*/;
		  var smallval/*int*/;
		  var p/*Array*/;
		  var q/*Array*/;
		  var previouscol/*int*/
		  var startpos/*int*/
		  
		  previouscol = 0;
		  startpos = 0;
		  for (i = 0; i < netsize; i++)
		  {
			  
			  p = network[i];
			  smallpos = i;
			  smallval = p[1]; /* index on g */
			  /* find smallest in i..netsize-1 */
			  for (j = i + 1; j < netsize; j++)
			  {
				  q = network[j];
				  if (q[1] < smallval)
				  { /* index on g */
				  
					smallpos = j;
					smallval = q[1]; /* index on g */
				}
			  }
			  
			  q = network[smallpos];
			  /* swap p (i) and q (smallpos) entries */
			  
			  if (i != smallpos)
			  {
				  
				  j = q[0];
				  q[0] = p[0];
				  p[0] = j;
				  j = q[1];
				  q[1] = p[1];
				  p[1] = j;
				  j = q[2];
				  q[2] = p[2];
				  p[2] = j;
				  j = q[3];
				  q[3] = p[3];
				  p[3] = j;
				  
			  }
			  
			  /* smallval entry is now in position i */
			  
			  if (smallval != previouscol)
			  
			  {
				  
				netindex[previouscol] = (startpos + i) >> 1;
				  
				for (j = previouscol + 1; j < smallval; j++) netindex[j] = i;
				  
				previouscol = smallval;
				startpos = i;
				
			  }
			  
			}
			
			netindex[previouscol] = (startpos + maxnetpos) >> 1;
			for (j = previouscol + 1; j < 256; j++) netindex[j] = maxnetpos; /* really 256 */
			
	   }
	   
	   /*
	   * Main Learning Loop ------------------
	   */
	   
	   var learn = function learn()/*void*/ 
	   
	   {
		   
		   var i/*int*/;
		   var j/*int*/;
		   var b/*int*/;
		   var g/*int*/
		   var r/*int*/;
		   var radius/*int*/;
		   var rad/*int*/;
		   var alpha/*int*/;
		   var step/*int*/;
		   var delta/*int*/;
		   var samplepixels/*int*/;
		   var p/*ByteArray*/;
		   var pix/*int*/;
		   var lim/*int*/;
		   
		   if (lengthcount < minpicturebytes) samplefac = 1;
		   
		   alphadec = 30 + ((samplefac - 1) / 3);
		   p = thepicture;
		   pix = 0;
		   lim = lengthcount;
		   samplepixels = lengthcount / (3 * samplefac);
		   delta = (samplepixels / ncycles) | 0;
		   alpha = initalpha;
		   radius = initradius;
		   
		   rad = radius >> radiusbiasshift;
		   if (rad <= 1) rad = 0;
		   
		   for (i = 0; i < rad; i++) radpower[i] = alpha * (((rad * rad - i * i) * radbias) / (rad * rad));
		   
		   
		   if (lengthcount < minpicturebytes) step = 3;
		   
		   else if ((lengthcount % prime1) != 0) step = 3 * prime1;
		   
		   else
		   
		   {
			   
			   if ((lengthcount % prime2) != 0) step = 3 * prime2;
			   
			   else
			   
			   {
				   
				   if ((lengthcount % prime3) != 0) step = 3 * prime3;
				   
				   else step = 3 * prime4;
				   
			   }
			   
		   }
		   
		   i = 0;
		   
		   while (i < samplepixels)
		   
		   {
			   
			   b = (p[pix + 0] & 0xff) << netbiasshift;
			   g = (p[pix + 1] & 0xff) << netbiasshift;
			   r = (p[pix + 2] & 0xff) << netbiasshift;
			   j = contest(b, g, r);
			   
			   altersingle(alpha, j, b, g, r);
			   
			   if (rad != 0) alterneigh(rad, j, b, g, r); /* alter neighbours */
			   
			   pix += step;
			   
			   if (pix >= lim) pix -= lengthcount;
			   
			   i++;
			   
			   if (delta == 0) delta = 1;
			   
			   if (i % delta == 0)
			   
			   {
				   
				   alpha -= alpha / alphadec;
				   radius -= radius / radiusdec;
				   rad = radius >> radiusbiasshift;
				   
				   if (rad <= 1) rad = 0;
				   
				   for (j = 0; j < rad; j++) radpower[j] = alpha * (((rad * rad - j * j) * radbias) / (rad * rad));
				   
			   }
			   
		   }
		   
	   }
	   
	   /*
	   ** Search for BGR values 0..255 (after net is unbiased) and return colour
	   * index
	   * ----------------------------------------------------------------------------
	   */
	   
	   var map = exports.map = function map(b/*int*/, g/*int*/, r/*int*/)/*int*/
	  
	   {
		   
		   var i/*int*/;
		   var j/*int*/;
		   var dist/*int*/
		   var a/*int*/;
		   var bestd/*int*/;
		   var p/*Array*/;
		   var best/*int*/;
		   
		   bestd = 1000; /* biggest possible dist is 256*3 */
		   best = -1;
		   i = netindex[g]; /* index on g */
		   j = i - 1; /* start at netindex[g] and work outwards */
	
	    while ((i < netsize) || (j >= 0))
		
		{
			
			if (i < netsize)
			
			{
				
				p = network[i];
				
				dist = p[1] - g; /* inx key */
				
				if (dist >= bestd) i = netsize; /* stop iter */
				
				else
				
				{
					
					i++;
					
					if (dist < 0) dist = -dist;
					
					a = p[0] - b;
					
					if (a < 0) a = -a;
					
					dist += a;
					
					if (dist < bestd)
					
					{
						
						a = p[2] - r;
						
						if (a < 0) a = -a;
						
						dist += a;
						
						if (dist < bestd)
						
						{
							
							bestd = dist;
							best = p[3];
							
						}
						
					}
					
				}
				
			}
		  
	      if (j >= 0)
		  {
			  
			  p = network[j];
			  
			  dist = g - p[1]; /* inx key - reverse dif */
			  
			  if (dist >= bestd) j = -1; /* stop iter */
			  
			  else 
			  {
				  
				  j--;
				  if (dist < 0) dist = -dist;
				  a = p[0] - b;
				  if (a < 0) a = -a;
				  dist += a;
				  
				  if (dist < bestd)
				  
				  {
					  
					  a = p[2] - r;
					  if (a < 0)a = -a;
					  dist += a;
					  if (dist < bestd)
					  {
						  bestd = dist;
						  best = p[3];
					  }
					  
				  }
				  
			  }
			  
		  }
		  
		}
		
	    return (best);
		
	  }
	  
	  var process = exports.process = function process()/*ByteArray*/
	  {
	   
	    learn();
	    unbiasnet();
	    inxbuild();
	    return colorMap();
		
	  }
	  
	  /*
	  * Unbias network to give byte values 0..255 and record position i to prepare
	  * for sort
	  * -----------------------------------------------------------------------------------
	  */
	  
	  var unbiasnet = function unbiasnet()/*void*/
	  
	  {
	
	    var i/*int*/;
	    var j/*int*/;
	
	    for (i = 0; i < netsize; i++)
		{
	      network[i][0] >>= netbiasshift;
	      network[i][1] >>= netbiasshift;
	      network[i][2] >>= netbiasshift;
	      network[i][3] = i; /* record colour no */
	    }
		
	  }
	  
	  /*
	  * Move adjacent neurons by precomputed alpha*(1-((i-j)^2/[r]^2)) in
	  * radpower[|i-j|]
	  * ---------------------------------------------------------------------------------
	  */
	  
	  var alterneigh = function alterneigh(rad/*int*/, i/*int*/, b/*int*/, g/*int*/, r/*int*/)/*void*/
	  
	  {
		  
		  var j/*int*/;
		  var k/*int*/;
		  var lo/*int*/;
		  var hi/*int*/;
		  var a/*int*/;
		  var m/*int*/;
		  
		  var p/*Array*/;
		  
		  lo = i - rad;
		  if (lo < -1) lo = -1;
		  
		  hi = i + rad;
		  
		  if (hi > netsize) hi = netsize;
		  
		  j = i + 1;
		  k = i - 1;
		  m = 1;
		  
		  while ((j < hi) || (k > lo))
		  
		  {
			  
			  a = radpower[m++];
			  
			  if (j < hi)
			  
			  {
				  
				  p = network[j++];
				  
				  try {
					  
					  p[0] -= (a * (p[0] - b)) / alpharadbias;
					  p[1] -= (a * (p[1] - g)) / alpharadbias;
					  p[2] -= (a * (p[2] - r)) / alpharadbias;
					  
					  } catch (e/*Error*/) {} // prevents 1.3 miscompilation
					  
				}
				
				if (k > lo)
				
				{
					
					p = network[k--];
					
					try
					{
						
						p[0] -= (a * (p[0] - b)) / alpharadbias;
						p[1] -= (a * (p[1] - g)) / alpharadbias;
						p[2] -= (a * (p[2] - r)) / alpharadbias;
						
					} catch (e/*Error*/) {}
					
				}
				
		  }
		  
	  }
	  
	  /*
	  * Move neuron i towards biased (b,g,r) by factor alpha
	  * ----------------------------------------------------
	  */
	  
	  var altersingle = function altersingle(alpha/*int*/, i/*int*/, b/*int*/, g/*int*/, r/*int*/)/*void*/ 
	  {
		  
		  /* alter hit neuron */
		  var n/*Array*/ = network[i];
		  n[0] -= (alpha * (n[0] - b)) / initalpha;
		  n[1] -= (alpha * (n[1] - g)) / initalpha;
		  n[2] -= (alpha * (n[2] - r)) / initalpha;
		
	  }
	  
	  /*
	  * Search for biased BGR values ----------------------------
	  */
	  
	  var contest = function contest(b/*int*/, g/*int*/, r/*int*/)/*int*/
	  {
		  
		  /* finds closest neuron (min dist) and updates freq */
		  /* finds best neuron (min dist-bias) and returns position */
		  /* for frequently chosen neurons, freq[i] is high and bias[i] is negative */
		  /* bias[i] = gamma*((1/netsize)-freq[i]) */
		  
		  var i/*int*/;
		  var dist/*int*/;
		  var a/*int*/;
		  var biasdist/*int*/;
		  var betafreq/*int*/;
		  var bestpos/*int*/;
		  var bestbiaspos/*int*/;
		  var bestd/*int*/;
		  var bestbiasd/*int*/;
		  var n/*Array*/;
		  
		  bestd = ~(1 << 31);
		  bestbiasd = bestd;
		  bestpos = -1;
		  bestbiaspos = bestpos;
		  
		  for (i = 0; i < netsize; i++)
		  
		  {
			  
			  n = network[i];
			  dist = n[0] - b;
			  
			  if (dist < 0) dist = -dist;
			  
			  a = n[1] - g;
			  
			  if (a < 0) a = -a;
			  
			  dist += a;
			  
			  a = n[2] - r;
			  
			  if (a < 0) a = -a;
			  
			  dist += a;
			  
			  if (dist < bestd)
			  
			  {
				  
				  bestd = dist;
				  bestpos = i;
				  
			  }
			  
			  biasdist = dist - ((bias[i]) >> (intbiasshift - netbiasshift));
			  
			  if (biasdist < bestbiasd)
			  
			  {
				  
				  bestbiasd = biasdist;
				  bestbiaspos = i;
				  
			  }
			  
			  betafreq = (freq[i] >> betashift);
			  freq[i] -= betafreq;
			  bias[i] += (betafreq << gammashift);
			  
		  }
		  
		  freq[bestpos] += beta;
		  bias[bestpos] -= betagamma;
		  return (bestbiaspos);
		  
	  }
	  
	  NeuQuant.apply(this, arguments);
	  return exports;
	}

// @@end js/jsgif/NeuQuant.js


// @@begin js/jsgif/GIFEncoder.js
/**
* This class lets you encode animated GIF files
* Base class :  http://www.java2s.com/Code/Java/2D-Graphics-GUI/AnimatedGifEncoder.htm
* @author Kevin Weiner (original Java version - kweiner@fmsware.com)
* @author Thibault Imbert (AS3 version - bytearray.org)
* @version 0.1 AS3 implementation
*/


	//import flash.utils.ByteArray;
	//import flash.display.BitmapData;
	//import flash.display.Bitmap;
	//import org.bytearray.gif.encoder.NeuQuant
	//import flash.net.URLRequestHeader;
	//import flash.net.URLRequestMethod;
	//import flash.net.URLRequest;
	//import flash.net.navigateToURL;
	
	const GIFEncoder = function()
	{
	    for(var i = 0, chr = {}; i < 256; i++)
        chr[i] = String.fromCharCode(i);
        
      function ByteArray(){
        this.bin = [];
      }

      ByteArray.prototype.getData = function(){
        
	      for(var v = '', l = this.bin.length, i = 0; i < l; i++)
          v += chr[this.bin[i]];
        return v;
      }
      ByteArray.prototype.writeByte = function(val){
        this.bin.push(val);
      }
      ByteArray.prototype.writeUTFBytes = function(string){
        for(var l = string.length, i = 0; i < l; i++)
          this.writeByte(string.charCodeAt(i));
      }
      ByteArray.prototype.writeBytes = function(array, offset, length){
        for(var l = length || array.length, i = offset||0; i < l; i++)
          this.writeByte(array[i]);
      }
	
	    var exports = {};
		/*private*/ var width/*int*/ // image size
  		/*private*/ var height/*int*/;
	    /*private*/ var transparent/***/ = null; // transparent color if given
	    /*private*/ var transIndex/*int*/; // transparent index in color table
	    /*private*/ var repeat/*int*/ = -1; // no repeat
	    /*private*/ var delay/*int*/ = 0; // frame delay (hundredths)
	    /*private*/ var started/*Boolean*/ = false; // ready to output frames
	    /*private*/ var out/*ByteArray*/;
	    /*private*/ var image/*Bitmap*/; // current frame
	    /*private*/ var pixels/*ByteArray*/; // BGR byte array from frame
	    /*private*/ var indexedPixels/*ByteArray*/ // converted frame indexed to palette
	    /*private*/ var colorDepth/*int*/; // number of bit planes
	    /*private*/ var colorTab/*ByteArray*/; // RGB palette
	    /*private*/ var usedEntry/*Array*/ = new Array; // active palette entries
	    /*private*/ var palSize/*int*/ = 7; // color table size (bits-1)
	    /*private*/ var dispose/*int*/ = -1; // disposal code (-1 = use default)
	    /*private*/ var closeStream/*Boolean*/ = false; // close stream when finished
	    /*private*/ var firstFrame/*Boolean*/ = true;
	    /*private*/ var sizeSet/*Boolean*/ = false; // if false, get size from first frame
	    /*private*/ var sample/*int*/ = 10; // default sample interval for quantizer
		
		/**
		* Sets the delay time between each frame, or changes it for subsequent frames
		* (applies to last frame added)
		* int delay time in milliseconds
		* @param ms
		*/
		
		var setDelay = exports.setDelay = function setDelay(ms/*int*/)/*void*/
		{
			
			delay = Math.round(ms / 10);
			
		}
		
		/**
		* Sets the GIF frame disposal code for the last added frame and any
		* 
		* subsequent frames. Default is 0 if no transparent color has been set,
		* otherwise 2.
		* @param code
		* int disposal code.
		*/
		
		var setDispose = exports.setDispose = function setDispose(code/*int*/)/*void*/ 
		{
			
			if (code >= 0) dispose = code;
			
		}
		
		/**
		* Sets the number of times the set of GIF frames should be played. Default is
		* 1; 0 means play indefinitely. Must be invoked before the first image is
		* added.
		* 
		* @param iter
		* int number of iterations.
		* @return
		*/
		
		var setRepeat = exports.setRepeat = function setRepeat(iter/*int*/)/*void*/ 
		{
			
			if (iter >= 0) repeat = iter;
			
		}
		
		/**
		* Sets the transparent color for the last added frame and any subsequent
		* frames. Since all colors are subject to modification in the quantization
		* process, the color in the final palette for each frame closest to the given
		* color becomes the transparent color for that frame. May be set to null to
		* indicate no transparent color.
		* @param
		* Color to be treated as transparent on display.
		*/
		
		var setTransparent = exports.setTransparent = function setTransparent(c/*Number*/)/*void*/
		{
			
			transparent = c;
			
		}
		
		/**
		* The addFrame method takes an incoming BitmapData object to create each frames
		* @param
		* BitmapData object to be treated as a GIF's frame
		*/
		
		var addFrame = exports.addFrame = function addFrame(im/*BitmapData*/, is_imageData)/*Boolean*/
		{
			
			if ((im == null) || !started || out == null) 
			{
				throw new Error ("Please call start method before calling addFrame");
//				return false;
			}
			
		    var ok/*Boolean*/ = true;
			
		    try {
				if(!is_imageData){
				  image = im.getImageData(0,0, im.canvas.width, im.canvas.height).data;
				  if (!sizeSet) setSize(im.canvas.width, im.canvas.height);
				}else{
				  image = im;
				}
				getImagePixels(); // convert to correct format if necessary
				analyzePixels(); // build color table & map pixels
				
				if (firstFrame) 
				{
					writeLSD(); // logical screen descriptior
					writePalette(); // global color table
					if (repeat >= 0) 
					{
						// use NS app extension to indicate reps
						writeNetscapeExt();
					}
		      }
			  
			  writeGraphicCtrlExt(); // write graphic control extension
		      writeImageDesc(); // image descriptor
		      if (!firstFrame) writePalette(); // local color table
		      writePixels(); // encode and write pixel data
		      firstFrame = false;
		    } catch (e/*Error*/) {
		      ok = false;
		    }
		    
			return ok;
			
		}
		
		/**
		* Adds final trailer to the GIF stream, if you don't call the finish method
		* the GIF stream will not be valid.
		*/
		
		var finish = exports.finish = function finish()/*Boolean*/
		{
		    if (!started) return false;
		    var ok/*Boolean*/ = true;
		    started = false;
		    try {
		      out.writeByte(0x3b); // gif trailer
		    } catch (e/*Error*/) {
		      ok = false;
		    }
	
		    return ok;
			
		}
		
		/**
		* Resets some members so that a new stream can be started.
		* This method is actually called by the start method
		*/
		
		var reset = function reset ( )/*void*/
		{
			
			// reset for subsequent use
			transIndex = 0;
			image = null;
		    pixels = null;
		    indexedPixels = null;
		    colorTab = null;
		    closeStream = false;
		    firstFrame = true;
			
		}

		/**
		* * Sets frame rate in frames per second. Equivalent to
		* <code>setDelay(1000/fps)</code>.
		* @param fps
		* float frame rate (frames per second)         
		*/
		
		var setFrameRate = exports.setFrameRate = function setFrameRate(fps/*Number*/)/*void*/ 
		{
			
			if (fps != 0xf) delay = Math.round(100/fps);
			
		}
		
		/**
		* Sets quality of color quantization (conversion of images to the maximum 256
		* colors allowed by the GIF specification). Lower values (minimum = 1)
		* produce better colors, but slow processing significantly. 10 is the
		* default, and produces good color mapping at reasonable speeds. Values
		* greater than 20 do not yield significant improvements in speed.
		* @param quality
		* int greater than 0.
		* @return
		*/
		
		var setQuality = exports.setQuality = function setQuality(quality/*int*/)/*void*/
		{
			
		    if (quality < 1) quality = 1;
		    sample = quality;
			
		}
		
		/**
		* Sets the GIF frame size. The default size is the size of the first frame
		* added if this method is not invoked.
		* @param w
		* int frame width.
		* @param h
		* int frame width.
		*/
		
		var setSize = exports.setSize = function setSize(w/*int*/, h/*int*/)/*void*/
		{
			
			if (started && !firstFrame) return;
		    width = w;
		    height = h;
		    if (width < 1)width = 320;
		    if (height < 1)height = 240;
		    sizeSet = true
			
		}
		
		/**
		* Initiates GIF file creation on the given stream.
		* @param os
		* OutputStream on which GIF images are written.
		* @return false if initial write failed.
		* 
		*/
		
		var start = exports.start = function start()/*Boolean*/
		{
			
			reset(); 
		    var ok/*Boolean*/ = true;
		    closeStream = false;
		    out = new ByteArray;
		    try {
		      out.writeUTFBytes("GIF89a"); // header
		    } catch (e/*Error*/) {
		      ok = false;
		    }
			
		    return started = ok;
			
		}
		
		var cont = exports.cont = function cont()/*Boolean*/
		{
			
		    reset(); 
		    var ok/*Boolean*/ = true;
		    closeStream = false;
		    out = new ByteArray;
			
		    return started = ok;
			
		}
		
		/**
		* Analyzes image colors and creates color map.
		*/
		
		var analyzePixels = function analyzePixels()/*void*/
		{
		    
		    var len/*int*/ = pixels.length;
		    var nPix/*int*/ = len / 3;
		    indexedPixels = [];
		    var initColorTab = new Set();
		    var k = 0;
		    for (var j = 0; j < nPix; j++) {
			initColorTab.add(((pixels[k++] & 0xff) << 16) + ((pixels[k++] & 0xff) << 8) + (pixels[k++] & 0xff));
			if (initColorTab.length > 256)
			    break;
		    }
		    if (initColorTab.length > 256) {
			palSize = 7;
			var nq/*NeuQuant*/ = new NeuQuant(pixels, len, sample);
			// initialize quantizer
			colorTab = nq.process(); // create reduced palette
			// map image pixels to new palette
			k/*int*/ = 0;
			for (var j/*int*/ = 0; j < nPix; j++) {
			    var index/*int*/ = nq.map(pixels[k++] & 0xff, pixels[k++] & 0xff, pixels[k++] & 0xff);
			    usedEntry[index] = true;
			    indexedPixels[j] = index;
			}
		    } else {
			colorTab = Array.from(initColorTab);
			k = 0;
			for (var j/*int*/ = 0; j < nPix; j++) {
			    var index/*int*/ = colorTab.indexOf(((pixels[k++] & 0xff) << 16) + ((pixels[k++] & 0xff) << 8) + (pixels[k++] & 0xff));
			    usedEntry[index] = true;
			    indexedPixels[j] = index;
			}
			var doConcat = function doConcat(prev, curr, cIndex, cArray) { return prev.concat((curr >>> 16),(curr >>> 8) & 0xff,curr & 0xff); }
			colorTab = colorTab.reduce(doConcat, []);
			palSize = Math.ceil(Math.log2(colorTab.length / 3)) - 1;

			/*
			It seems that palSize has to be positive, 
			so the minimum 18.c.4 in the spec 
			(https://www.w3.org/Graphics/GIF/spec-gif89a.txt) 
			value can be 0 (denoting a palette of size 2).
			*/
			if (palSize===-1){
				palSize=0;
			}
		    }
		    pixels = null;
		    colorDepth = 8;
		    // get closest match to transparent color if specified
		    if (transparent != null) {
			transIndex = findClosest(transparent);
		    }
		}
		
		/**
		* Returns index of palette color closest to c
		*
		*/
		
		var findClosest = function findClosest(c/*Number*/)/*int*/
		{
			
			if (colorTab == null) return -1;
		    var r/*int*/ = (c & 0xFF0000) >> 16;
		    var g/*int*/ = (c & 0x00FF00) >> 8;
		    var b/*int*/ = (c & 0x0000FF);
		    var minpos/*int*/ = 0;
		    var dmin/*int*/ = 256 * 256 * 256;
		    var len/*int*/ = colorTab.length;
			
		    for (var i/*int*/ = 0; i < len;) {
		      var dr/*int*/ = r - (colorTab[i++] & 0xff);
		      var dg/*int*/ = g - (colorTab[i++] & 0xff);
		      var db/*int*/ = b - (colorTab[i] & 0xff);
		      var d/*int*/ = dr * dr + dg * dg + db * db;
		      var index/*int*/ = i / 3;
		      if (usedEntry[index] && (d < dmin)) {
		        dmin = d;
		        minpos = index;
		      }
		      i++;
		    }
		    return minpos;
			
		}
		
		/**
		* Extracts image pixels into byte array "pixels
		*/
		
		var getImagePixels = function getImagePixels()/*void*/
		{
		    
		    var w/*int*/ = width;
		    var h/*int*/ = height;
		    pixels = [];
  			var data = image;
		    var count/*int*/ = 0;
		    
		    for ( var i/*int*/ = 0; i < h; i++ )
		    {
		    	
		    	for (var j/*int*/ = 0; j < w; j++ )
		    	{
		    		
	        		var b = (i*w*4)+j*4;
	        		pixels[count++] = data[b];
	        		pixels[count++] = data[b+1];
	        		pixels[count++] = data[b+2];
		    		
		    	}
		    	
		    }
		    
		}
		
		/**
		* Writes Graphic Control Extension
		*/
		
		var writeGraphicCtrlExt = function writeGraphicCtrlExt()/*void*/
		{
			out.writeByte(0x21); // extension introducer
		    out.writeByte(0xf9); // GCE label
		    out.writeByte(4); // data block size
		    var transp/*int*/
		    var disp/*int*/;
		    if (transparent == null) {
		      transp = 0;
		      disp = 0; // dispose = no action
		    } else {
		      transp = 1;
		      disp = 2; // force clear if using transparent color
		    }
		    if (dispose >= 0) {
		      disp = dispose & 7; // user override
		    }
		    disp <<= 2;
		    // packed fields
		    out.writeByte(0 | // 1:3 reserved
		        disp | // 4:6 disposal
		        0 | // 7 user input - 0 = none
		        transp); // 8 transparency flag
		
		    WriteShort(delay); // delay x 1/100 sec
		    out.writeByte(transIndex); // transparent color index
		    out.writeByte(0); // block terminator
			
		}
		  
		/**
		* Writes Image Descriptor
		*/
		
		var writeImageDesc = function writeImageDesc()/*void*/
		{
		  	
		    out.writeByte(0x2c); // image separator
		   	WriteShort(0); // image position x,y = 0,0
		    WriteShort(0);
		    WriteShort(width); // image size
		    WriteShort(height);

		    // packed fields
		    if (firstFrame) {
		      // no LCT - GCT is used for first (or only) frame
		      out.writeByte(0);
		    } else {
		      // specify normal LCT
		      out.writeByte(0x80 | // 1 local color table 1=yes
		          0 | // 2 interlace - 0=no
		          0 | // 3 sorted - 0=no
		          0 | // 4-5 reserved
		          palSize); // 6-8 size of color table
		    }
		}
		
		/**
		* Writes Logical Screen Descriptor
		*/
		
		var writeLSD = function writeLSD()/*void*/
		{
			
			// logical screen size
		    WriteShort(width);
		    WriteShort(height);
		    // packed fields
		    out.writeByte((0x80 | // 1 : global color table flag = 1 (gct used)
		        0x70 | // 2-4 : color resolution = 7
		        0x00 | // 5 : gct sort flag = 0
		        palSize)); // 6-8 : gct size
		
		    out.writeByte(0); // background color index
		    out.writeByte(0); // pixel aspect ratio - assume 1:1
			
		}
		
		/**
		* Writes Netscape application extension to define repeat count.
		*/
		
		var writeNetscapeExt = function writeNetscapeExt()/*void*/
		{
			
		    out.writeByte(0x21); // extension introducer
		    out.writeByte(0xff); // app extension label
		    out.writeByte(11); // block size
		    out.writeUTFBytes("NETSCAPE" + "2.0"); // app id + auth code
		    out.writeByte(3); // sub-block size
		    out.writeByte(1); // loop sub-block id
		    WriteShort(repeat); // loop count (extra iterations, 0=repeat forever)
		    out.writeByte(0); // block terminator
		
		}
		
		/**
		* Writes color table
		*/
		
		var writePalette = function writePalette()/*void*/
		{
		    out.writeBytes(colorTab);
		    var n/*int*/ = (3 * Math.pow(2,palSize+1)) - colorTab.length;
		    for (var i/*int*/ = 0; i < n; i++) out.writeByte(0);
			
		}
		
		var WriteShort = function WriteShort (pValue/*int*/)/*void*/
		{  	
			
		  	out.writeByte( pValue & 0xFF );
		  	out.writeByte( (pValue >> 8) & 0xFF);
			
		}
		
		/**
		* Encodes and writes pixel data
		*/
		
		var writePixels = function writePixels()/*void*/
		{
			
		    var myencoder/*LZWEncoder*/ = new LZWEncoder(width, height, indexedPixels, colorDepth);
		    myencoder.encode(out);
			
		}
		
		/**
		* retrieves the GIF stream
		*/
		var stream = exports.stream = function stream ( )/*ByteArray*/
		{
			
			return out; 
			
		}
		
		var setProperties = exports.setProperties = function setProperties(has_start, is_first){
		  started = has_start;
		  firstFrame = is_first;
		  //out = new ByteArray; //??
		}
		
		return exports
		  
	}

// @@end js/jsgif/GIFEncoder.js


// @@begin js/storagewrapper.js
function storage_has(key){
    return localStorage.getItem(key)!==null;
}

function storage_get(key){
    return localStorage.getItem(key);
}

function storage_set(key,value){
    return localStorage.setItem(key,value);
}

function storage_remove(key){
    localStorage.removeItem(key);
}
// @@end js/storagewrapper.js


// @@begin js/debug.js
var canSetHTMLColors=false;
var canDump=true;
var canYoutube=false;
var recordingStartsFromLevel=0;
var inputHistory=[];
var compiledText;
var canOpenEditor=true;
var IDE=true;
solving = false;

var debugger_turnIndex=0;
var debug_visualisation_array=[];
var diffToVisualize=null;

function convertLevelToString() {
	var out = '';
	var seenCells = {};
	var i = 0;
	for (var y = 0; y < level.height; y++) {
		for (var x = 0; x < level.width; x++) {
			var bitmask = level.getCell(x + y * level.width);
			var objs = [];
			for (var bit = 0; bit < 32 * STRIDE_OBJ; ++bit) {
				if (bitmask.get(bit)) {
					objs.push(state.idDict[bit])
				}
			}
			objs.sort();
			objs = objs.join(" ");
			/* replace repeated object combinations with numbers */
			if (!seenCells.hasOwnProperty(objs)) {
				seenCells[objs] = i++;
				out += objs + ":";
			}
			out += seenCells[objs] + ",";
		}
		out += '\n';
	}
	return out;
}

function stripHTMLTags(html_str){
	var div = document.createElement("div");
	div.innerHTML = html_str;
	var text = div.textContent || div.innerText || "";
	return text.trim();
}

function dumpTestCase() {
	//compiler error data
	var levelDat = compiledText;
	var errorStrings_stripped = errorStrings.map(stripHTMLTags);
	var resultarray = [levelDat,errorStrings_stripped,errorCount];
	var resultstring = JSON.stringify(resultarray);
	resultstring = `<br>
	[<br>
		"${state.metadata.title||"untitled test"}",<br>
		${resultstring}<br>
	],`;
	selectableint++;
	var tag = 'selectable'+selectableint;
	consolePrint("<br>Compilation error/warning data (for error message tests - errormessage_testdata.js):<br><br><br><span id=\""+tag+"\" onclick=\"selectText('"+tag+"',event)\">"+resultstring+"</span><br><br><br>",true);

	
	//normal session recording data
	var levelDat = compiledText;
	var input = inputHistory.concat([]);
	var outputDat = convertLevelToString();

	var resultarray = [levelDat,input,outputDat,recordingStartsFromLevel,loadedLevelSeed];
	var resultstring = JSON.stringify(resultarray);
	resultstring = `<br>
	[<br>
		"${state.metadata.title||"untitled test"}",<br>
		${resultstring}<br>
	],`;
	
	selectableint++;
	var tag = 'selectable'+selectableint;
	
	consolePrint("<br>Recorded play session data (for play session tests - testdata.js):<br><br><br><span id=\""+tag+"\" onclick=\"selectText('"+tag+"',event)\">"+resultstring+"</span><br><br><br>",true);

}

function clearInputHistory() {
	if (canDump===true) {
		inputHistory=[];
		recordingStartsFromLevel = curlevel;
	}
}

function pushInput(inp) {
	if (canDump===true) {
		inputHistory.push(inp);
	}
}

// @@end js/debug.js


// @@begin js/globalVariables.js
var unitTesting=false;
var curlevel=0;
var solvedSections = [];
var curlevelTarget=null;
var hasUsedCheckpoint=false;
var levelEditorOpened=false;
var muted=0;
var runrulesonlevelstart_phase=false;
var ignoreNotJustPressedAction=true;

function doSetupTitleScreenLevelContinue(){
    try {
        if (storage_has(document.URL)) {
            if (storage_has(document.URL+'_checkpoint')){
                var backupStr = storage_get(document.URL+'_checkpoint');
                curlevelTarget = JSON.parse(backupStr);
                
                var arr = [];
                for(var p in Object.keys(curlevelTarget.dat)) {
                    arr[p] = curlevelTarget.dat[p];
                }
                curlevelTarget.dat = new Int32Array(arr);

            }
            curlevel = storage_get(document.URL); 
    		    if (localStorage[document.URL+"_sections"]!==undefined) {
                    solvedSections = JSON.parse(localStorage.getItem(document.URL + "_sections"));
                }
    		}
    } catch(ex) {
    }
}

doSetupTitleScreenLevelContinue();


var verbose_logging=false;
var throttle_movement=false;
var cache_console_messages=false;
var quittingTitleScreen=false;
var quittingMessageScreen=false;
var deltatime=17;
var timer=0;
var repeatinterval=150;
var autotick=0;
var autotickinterval=0;
var winning=false;
var againing=false;
var againinterval=150;
var norepeat_action=false;
var oldflickscreendat=[];//used for buffering old flickscreen/scrollscreen positions, in case player vanishes
var keybuffer = [];

var tweeninterval=0;
var tweentimer=0;

var restarting=false;

var messageselected=false;

var textImages={};
var initLevel = {
    width: 5,
    height: 5,
    layerCount: 2,
    dat: [
    1, 3, 3, 1, 1, 2, 2, 3, 3, 1,
    2, 1, 2, 2, 3, 3, 1, 1, 2, 2,
    3, 2, 1, 3, 2, 1, 3, 2, 1, 3,
    1, 3, 3, 1, 1, 2, 2, 3, 3, 1,
    2, 1, 2, 2, 3, 3, 1, 1, 2, 2
    ],
    movementMask:[
    1, 3, 3, 1, 1, 2, 2, 3, 3, 1,
    2, 1, 2, 2, 3, 3, 1, 1, 2, 2,
    3, 2, 1, 3, 2, 1, 3, 2, 1, 3,
    1, 3, 3, 1, 1, 2, 2, 3, 3, 1,
    2, 1, 2, 2, 3, 3, 1, 1, 2, 2
    ],
    rigidGroupIndexMask:[],//[indexgroupNumber, masked by layer arrays]
    rigidMovementAppliedMask:[],//[indexgroupNumber, masked by layer arrays]
    bannedGroup:[],
    colCellContents:[],
    rowCellContents:[],
    colCellContents_Movements:[],
    rowCellContents_Movements:[],
};

var level = initLevel;

// @@end js/globalVariables.js


// @@begin js/font.js

var font = {
    '0':`
00000
00000
00000
01110
10001
10011
10101
11001
10001
01110
00000
00000`,
	'1':`
00000
00000
00000
11100
00100
00100
00100
00100
00100
11111
00000
00000`,
	'2':`
00000
00000
00000
11110
00001
00001
01110
10000
10000
11111
00000
00000`,
	'3':`
00000
00000
00000
11110
00001
00110
00001
00001
00001
11110
00000
00000`,
	'4':`
00000
00000
00000
10000
10000
10000
10010
11111
00010
00010
00000
00000`,
	'5':`
00000
00000
00000
11111
10000
11110
00001
00001
00001
11110
00000
00000`,
	'6':`
00000
00000
00000
01110
10000
11110
10001
10001
10001
01110
00000
00000`,
	'7':`
00000
00000
00000
11111
00001
00010
00100
00100
00100
00100
00000
00000`,
	'8':`
00000
00000
00000
01110
10001
01110
10001
10001
10001
01110
00000
00000`,
	'9':`
00000
00000
00000
01110
10001
10001
10001
01111
00001
01110
00000
00000`,
	'a':`
00000
00000
00000
00000
00000
01111
10001
10001
10001
01111
00000
00000`,
	'b':`
00000
00000
00000
10000
10000
11110
10001
10001
10001
01110
00000
00000`,
	'c':`
00000
00000
00000
00000
00000
01111
10000
10000
10000
01111
00000
00000`,
	'd':`
00000
00000
00000
00001
00001
01111
10001
10001
10001
01111
00000
00000`,
	'e':`
00000
00000
00000
00000
00000
01110
10001
11111
10000
01110
00000
00000`,
	'f':`
00000
00000
00000
00011
00100
11111
00100
00100
00100
00100
00000
00000`,
	'g':`
00000
00000
00000
00000
00000
01111
10001
10001
10001
01111
00001
01110`,
	'h':`
00000
00000
00000
10000
10000
11110
10001
10001
10001
10001
00000
00000`,
	'i':`
00000
00000
00000
00100
00000
01100
00100
00100
00100
01110
00000
00000`,
	'j':`
00000
00000
00000
00100
00000
01100
00100
00100
00100
00100
10100
01000`,
	'k':`
00000
00000
00000
10000
10000
10001
10010
11100
10010
10001
00000
00000`,
	'l':`
00000
00000
00000
01100
00100
00100
00100
00100
00100
01110
00000
00000`,
	'm':`
00000
00000
00000
00000
00000
01010
10101
10101
10101
10101
00000
00000`,
	'n':`
00000
00000
00000
00000
00000
01110
10001
10001
10001
10001
00000
00000`,
	'o':`
00000
00000
00000
00000
00000
01110
10001
10001
10001
01110
00000
00000`,
	'p':`
00000
00000
00000
00000
00000
11110
10001
10001
10001
11110
10000
10000`,
	'q':`
00000
00000
00000
00000
00000
01111
10001
10001
10001
01111
00001
00001`,
	'r':`
00000
00000
00000
00000
00000
01111
10000
10000
10000
10000
00000
00000`,
	's':`
00000
00000
00000
00000
00000
01111
10000
01110
00001
11110
00000
00000`,
	't':`
00000
00000
00000
00100
00100
11111
00100
00100
00100
00011
00000
00000`,
	'u':`
00000
00000
00000
00000
00000
10001
10001
10001
10001
01111
00000
00000`,
	'v':`
00000
00000
00000
00000
00000
10001
10010
10100
11000
10000
00000
00000`,
	'w':`
00000
00000
00000
00000
00000
10101
10101
10101
10101
01010
00000
00000`,
	'x':`
00000
00000
00000
00000
00000
10001
01010
00100
01010
10001
00000
00000`,
	'×':`
00000
00000
00000
00000
00000
10001
01010
00100
01010
10001
00000
00000`,
	'y':`
00000
00000
00000
00000
00000
10001
10001
10001
10001
01111
00001
11110`,
	'z':`
00000
00000
00000
00000
00000
11111
00010
00100
01000
11111
00000
00000`,
	'A':`
00000
00000
00000
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'B':`
00000
00000
00000
11110
10001
11110
10001
10001
10001
11110
00000
00000`,
	'C':`
00000
00000
00000
01111
10000
10000
10000
10000
10000
01111
00000
00000`,
	'D':`
00000
00000
00000
11110
10001
10001
10001
10001
10001
11110
00000
00000`,
	'E':`
00000
00000
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'F':`
00000
00000
00000
11111
10000
11111
10000
10000
10000
10000
00000
00000`,
	'G':`
00000
00000
00000
01111
10000
10000
10000
10011
10001
01111
00000
00000`,
	'H':`
00000
00000
00000
10001
10001
11111
10001
10001
10001
10001
00000
00000`,
	'I':`
00000
00000
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'J':`
00000
00000
00000
01111
00001
00001
00001
00001
00001
01110
00000
00000`,
	'K':`
00000
00000
00000
10001
10010
10100
11000
10100
10010
10001
00000
00000`,
	'L':`
00000
00000
00000
10000
10000
10000
10000
10000
10000
11111
00000
00000`,
	'M':`
00000
00000
00000
11111
10101
10101
10101
10101
10101
10101
00000
00000`,
	'N':`
00000
00000
00000
10001
11001
10101
10011
10001
10001
10001
00000
00000`,
	'O':`
00000
00000
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'P':`
00000
00000
00000
11110
10001
10001
10001
11110
10000
10000
00000
00000`,
	'Q':`
00000
00000
00000
01110
10001
10001
10001
10001
10101
01110
00100
00000`,
	'R':`
00000
00000
00000
11110
10001
10001
11110
10001
10001
10001
00000
00000`,
	'S':`
00000
00000
00000
01111
10000
01110
00001
00001
00001
11110
00000
00000`,
	'T':`
00000
00000
00000
11111
00100
00100
00100
00100
00100
00100
00000
00000`,
	'U':`
00000
00000
00000
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'V':`
00000
00000
00000
10001
10001
10001
10001
10001
01010
00100
00000
00000`,
	'W':`
00000
00000
00000
10101
10101
10101
10101
10101
10101
01010
00000
00000`,
	'X':`
00000
00000
00000
10001
10001
01010
00100
01010
10001
10001
00000
00000`,
	'Y':`
00000
00000
00000
10001
10001
01010
00100
00100
00100
00100
00000
00000`,
	'Z':`
00000
00000
00000
11111
00001
00010
00100
01000
10000
11111
00000
00000`,
	'.':`
00000
00000
00000
00000
00000
00000
00000
00000
00000
00100
00000
00000`,
	'·':`
00000
00000
00000
00000
00000
00000
00100
00000
00000
00000
00000
00000`,
	'•':`
00000
00000
00000
00000
00000
01110
01110
01110
00000
00000
00000
00000`,
	'…':`
00000
00000
00000
00000
00000
00000
00000
00000
00000
10101
00000
00000`,
	'†':`
00000
00100
00100
01110
00100
00100
00100
00100
00100
00100
00000
00000`,
	'‡':`
00000
00100
00100
01110
00100
00100
00100
00100
01110
00100
00000
00000`,
	'ƒ':`
00000
00000
00000
00011
00100
11111
00100
00100
00100
00100
01000
00000`,
	'‚':`
00000
00000
00000
00000
00000
00000
00000
00000
00100
01100
00000
00000`,
	'„':`
00000
00000
00000
00000
00000
00000
00000
00000
01001
11011
00000
00000`,
	',':`
00000
00000
00000
00000
00000
00000
00000
00000
00100
01100
00000
00000`,
	';':`
00000
00000
00000
00000
00000
00100
00000
00000
00100
01100
00000
00000`,
	':':`
00000
00000
00000
00000
00000
00100
00000
00000
00000
00100
00000
00000`,
	'?':`
00000
00000
00000
01110
10001
00001
00001
00110
00000
00100
00000
00000`,
	'¿':`
00000
00000
00000
00100
00000
01100
10000
10000
10001
01110
00000
00000`,
	'!':`
00000
00000
00000
00100
00100
00100
00100
00100
00000
00100
00000
00000`,
	'¡':`
00000
00000
00000
00100
00000
00100
00100
00100
00100
00100
00000
00000`,
	'@':`
00000
00000
00000
00000
00000
01110
10001
10111
10000
01110
00000
00000`,
	'£':`
00000
00000
00000
00000
00000
01110
01001
11100
01000
11111
00000
00000`,
	'$':`
00000
00000
00000
00000
00100
01111
10100
01110
00101
11110
00100
00000`,
	'%':`
00000
00000
00000
00000
00000
11001
11010
00100
01011
10011
00000
00000`,
	'‰':`
00000
00000
00000
00000
11001
11010
00100
01011
10011
00000
00011
00011`,
	'^':`
00000
00000
00000
00100
01010
00000
00000
00000
00000
00000
00000
00000`,
	'&':`
00000
00000
00000
00000
00000
01100
10000
01011
10010
01100
00000
00000`,
	'*':`
00000
00000
00000
00000
00000
01010
00100
01010
00000
00000
00000
00000`,
	'(':`
00000
00000
00000
00010
00100
00100
00100
00100
00100
00010
00000
00000`,
	')':`
00000
00000
00000
01000
00100
00100
00100
00100
00100
01000
00000
00000`,
	'+':`
00000
00000
00000
00000
00000
00100
00100
11111
00100
00100
00000
00000`,
	'÷':`
00000
00000
00000
00000
00000
00100
00000
11111
00000
00100
00000
00000`,
	'±':`
00000
00000
00000
00000
00000
00100
00100
11111
00100
11111
00000
00000`,
	'-':`
00000
00000
00000
00000
00000
00000
00000
01110
00000
00000
00000
00000`,
	'–':`
00000
00000
00000
00000
00000
00000
00000
11110
00000
00000
00000
00000`,
	'—':`
00000
00000
00000
00000
00000
00000
00000
11111
00000
00000
00000
00000`,
	'_':`
00000
00000
00000
00000
00000
00000
00000
00000
00000
11111
00000
00000`,
	'=':`
00000
00000
00000
00000
00000
00000
11111
00000
11111
00000
00000
00000`,
	' ':`
00000
00000
00000
00000
00000
00000
00000
00000
00000
00000
00000
00000`,
	'{':`
00000
00000
00000
00110
00100
00100
01100
00100
00100
00110
00000
00000`,
	'}':`
00000
00000
00000
01100
00100
00100
00110
00100
00100
01100
00000
00000`,
	'[':`
00000
00000
00000
00110
00100
00100
00100
00100
00100
00110
00000
00000`,
	']':`
00000
00000
00000
01100
00100
00100
00100
00100
00100
01100
00000
00000`,
	'\'':`
00000
00000
00000
00100
00100
00100
00000
00000
00000
00000
00000
00000`,
	'‘':`
00000
00000
00000
00110
00100
00000
00000
00000
00000
00000
00000
00000`,
	'’':`
00000
00000
00000
00100
01100
00000
00000
00000
00000
00000
00000
00000`,
	'“':`
00000
00000
00000
11011
10010
00000
00000
00000
00000
00000
00000
00000`,
	'”':`
00000
00000
00000
01001
11011
00000
00000
00000
00000
00000
00000
00000`,
	'"':`
00000
00000
00000
01010
01010
01010
00000
00000
00000
00000
00000
00000`,
	'/':`
00000
00000
00000
00000
00000
00001
00010
00100
01000
10000
00000
00000`,
	'\\':`
00000
00000
00000
00000
00000
10000
01000
00100
00010
00001
00000
00000`,
	'|':`
00000
00000
00000
00000
00000
00100
00100
00100
00100
00100
00000
00000`,
	'¦':`
00000
00000
00000
00000
00100
00100
00000
00100
00100
00100
00000
00000`,
	'<':`
00000
00000
00000
00000
00000
00010
00100
01000
00100
00010
00000
00000`,
	'‹':`
00000
00000
00000
00000
00000
00000
00100
01000
00100
00000
00000
00000`,
	'«':`
00000
00000
00000
00000
00000
00000
01001
10010
01001
00000
00000
00000`,
	'>':`
00000
00000
00000
00000
00000
01000
00100
00010
00100
01000
00000
00000`,
	'›':`
00000
00000
00000
00000
00000
00000
00100
00010
00100
00000
00000
00000`,
	'»':`
00000
00000
00000
00000
00000
00000
10010
01001
10010
00000
00000
00000`,
	'~':`
00000
00000
00000
00000
00000
00000
01000
10101
00010
00000
00000
00000`,
	'˜':`
00000
00000
00000
00000
00000
01010
10100
00000
00000
00000
00000
00000`,
	'`':`
00000
00000
00000
00000
00000
01000
00100
00000
00000
00000
00000
00000`,
	'#':`
00000
00000
00000
00000
00000
01010
11111
01010
11111
01010
00000
00000`,
	'À':`
01000
00100
00000
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'Á':`
00010
00100
00000
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'Â':`
00100
01010
00000
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'Ã':`
01000
10101
00010
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'Ä':`
00000
01010
00000
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'Å':`
00100
01010
00100
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'Æ':`
00000
00000
00000
01111
10100
10100
10100
11111
10100
10111
00000
00000`,
	'Ç':`
00000
00000
00000
01111
10000
10000
10000
10000
10000
01111
00100
01000`,
	'È':`
01000
00100
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'É':`
00010
00100
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'Ê':`
00100
01010
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'Ë':`
00000
01010
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'Ì':`
01000
00100
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'Í':`
00010
00100
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'Î':`
00100
01010
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'Ï':`
00000
01010
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'Ð':`
00000
00000
00000
01110
01001
01001
11101
01001
01001
01110
00000
00000`,
	'Ñ':`
01001
10110
00000
10001
11001
10101
10011
10001
10001
10001
00000
00000`,
	'Ò':`
01000
00100
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Ó':`
00010
00100
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Ô':`
00100
01010
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Õ':`
01001
10110
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Ö':`
00000
01010
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Ø':`
00000
00010
00100
01110
10101
10101
10101
10101
10101
01110
00100
01000`,
	'Ù':`
00000
01000
00100
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Ú':`
00000
00010
00100
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Û':`
00100
01010
00000
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Ü':`
00000
01010
00000
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'Ý':`
00000
00000
00100
10001
10001
01010
00100
00100
00100
00100
00000
00000`,
	'Þ':`
00000
00000
10000
11110
10001
10001
10001
10001
10001
11110
10000
00000`,
	'ß':`
00000
00000
00000
01110
10001
10110
10001
10001
10001
10110
10000
00000`,
	'ẞ':`
00000
00000
00000
01110
10001
10110
10001
10001
10001
10110
00000
00000`,
	'à':`
00000
00000
01000
00100
00000
01111
10001
10001
10001
01111
00000
00000`,
	'á':`
00000
00000
00010
00100
00000
01111
10001
10001
10001
01111
00000
00000`,
	'â':`
00000
00000
00100
01010
00000
01111
10001
10001
10001
01111
00000
00000`,
	'ã':`
00000
00000
01001
10110
00000
01111
10001
10001
10001
01111
00000
00000`,
	'ä':`
00000
00000
00000
01010
00000
01111
10001
10001
10001
01111
00000
00000`,
	'å':`
00000
00100
01010
00100
00000
01111
10001
10001
10001
01111
00000
00000`,
	'æ':`
00000
00000
00000
00000
00000
01110
10101
10110
10100
01111
00000
00000`,
	'ç':`
00000
00000
00000
00000
00000
01111
10000
10000
10000
01111
00100
01000`,
	'è':`
00000
00000
01000
00100
00000
01110
10001
11111
10000
01110
00000
00000`,
	'é':`
00000
00000
00010
00100
00000
01110
10001
11111
10000
01110
00000
00000`,
	'ê':`
00000
00000
00100
01010
00000
01110
10001
11111
10000
01110
00000
00000`,
	'ë':`
00000
00000
00000
01010
00000
01110
10001
11111
10000
01110
00000
00000`,
	'ì':`
00000
00000
01000
00100
00000
01100
00100
00100
00100
01110
00000
00000`,
	'í':`
00000
00000
00010
00100
00000
01100
00100
00100
00100
01110
00000
00000`,
	'î':`
00000
00000
00100
01010
00000
01100
00100
00100
00100
01110
00000
00000`,
	'ï':`
00000
00000
00000
01010
00000
01100
00100
00100
00100
01110
00000
00000`,
	'ð':`
00000
00000
00010
00111
00010
01110
10010
10010
10010
01110
00000
00000`,
	'ñ':`
00000
00000
01001
10110
00000
01110
10001
10001
10001
10001
00000
00000`,
	'ò':`
00000
00000
01000
00100
00000
01110
10001
10001
10001
01110
00000
00000`,
	'ó':`
00000
00000
00010
00100
00000
01110
10001
10001
10001
01110
00000
00000`,
	'ô':`
00000
00000
00100
01010
00000
01110
10001
10001
10001
01110
00000
00000`,
	'õ':`
00000
00000
01001
10110
00000
01110
10001
10001
10001
01110
00000
00000`,
	'ö':`
00000
00000
00000
01010
00000
01110
10001
10001
10001
01110
00000
00000`,
	'ø':`
00000
00000
00000
00010
00100
01110
10101
10101
10101
01110
00100
01000`,
	'ù':`
00000
00000
00000
01000
00100
10001
10001
10001
10001
01111
00000
00000`,
	'ú':`
00000
00000
00000
00010
00100
10001
10001
10001
10001
01111
00000
00000`,
	'û':`
00000
00000
00100
01010
00000
10001
10001
10001
10001
01111
00000
00000`,
	'ü':`
00000
00000
00000
01010
00000
10001
10001
10001
10001
01111
00000
00000`,
	'ý':`
00000
00000
00000
00010
00100
10001
10001
10001
10001
01111
00001
11110`,
	'þ':`
00000
00000
00000
10000
10000
11110
10001
10001
10001
11110
10000
10000`,
	'ÿ':`
00000
00000
00000
01010
00000
10001
10001
10001
10001
01111
00001
11110`,
	'Ā':`
00000
01110
00000
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'ā':`
00000
00000
00000
01110
00000
01111
10001
10001
10001
01111
00000
00000`,
	'Ă':`
01010
00100
00000
01110
10001
10001
10001
11111
10001
10001
00000
00000`,
	'ă':`
00000
00000
01010
00100
00000
01111
10001
10001
10001
01111
00000
00000`,
	'Ą':`
00000
00000
00000
01110
10001
10001
10001
11111
10001
10001
00010
00001`,
	'ą':`
00000
00000
00000
00000
00000
01111
10001
10001
10001
01111
00010
00001`,
	'Ć':`
00010
00100
00000
01111
10000
10000
10000
10000
10000
01111
00000
00000`,
	'ć':`
00000
00000
00010
00100
00000
01111
10000
10000
10000
01111
00000
00000`,
	'Ĉ':`
00100
01010
00000
01111
10000
10000
10000
10000
10000
01111
00000
00000`,
	'ĉ':`
00000
00000
00100
01010
00000
01111
10000
10000
10000
01111
00000
00000`,
	'Ċ':`
00000
00100
00000
01111
10000
10000
10000
10000
10000
01111
00000
00000`,
	'ċ':`
00000
00000
00000
00100
00000
01111
10000
10000
10000
01111
00000
00000`,
	'Č':`
01010
00100
00000
01111
10000
10000
10000
10000
10000
01111
00000
00000`,
	'č':`
00000
00000
01010
00100
00000
01111
10000
10000
10000
01111
00000
00000`,
	'Ď':`
01010
00100
00000
11110
10001
10001
10001
10001
10001
11110
00000
00000`,
	'ď':`
00000
00000
00000
00101
00101
01100
10100
10100
10100
01100
00000
00000`,
	'Đ':`
00000
00000
00000
01110
01001
01001
11101
01001
01001
01110
00000
00000`,
	'đ':`
00000
00000
00010
00111
00010
01110
10010
10010
10010
01110
00000
00000`,
	'Ē':`
00000
01110
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'ē':`
00000
00000
00000
01110
00000
01110
10001
11111
10000
01110
00000
00000`,
	'Ĕ':`
01010
00100
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'ĕ':`
00000
00000
01010
00100
00000
01110
10001
11111
10000
01110
00000
00000`,
	'Ė':`
00000
00100
00000
11111
10000
11111
10000
10000
10000
11111
00000
00000`,
	'ė':`
00000
00000
00000
00100
00000
01110
10001
11111
10000
01110
00000
00000`,
	'Ę':`
00000
00000
00000
11111
10000
11111
10000
10000
10000
11111
00010
00001`,
	'ę':`
00000
00000
00000
00000
00000
01110
10001
11111
10000
01110
00010
00001`,
	'Ě':`
01010
00100
00000
11111
10000
11111
10000
10000
10000
11110
00000
00000`,
	'ě':`
00000
00000
01010
00100
00000
01110
10001
11111
10000
01110
00000
00000`,
	'Ĝ':`
00100
01010
00000
01111
10000
10000
10000
10011
10001
01111
00000
00000`,
	'ĝ':`
00000
00000
00100
01010
00000
01111
10001
10001
10001
01111
00001
01110`,
	'Ğ':`
01010
00100
00000
01111
10000
10000
10000
10011
10001
01111
00000
00000`,
	'ğ':`
00000
00000
01010
00100
00000
01111
10001
10001
10001
01111
00001
01110`,
	'Ġ':`
00000
00100
00000
01111
10000
10000
10000
10011
10001
01111
00000
00000`,
	'ġ':`
00000
00000
00000
00100
00000
01111
10001
10001
10001
01111
00001
01110`,
	'Ģ':`
00000
00000
00000
01111
10000
10000
10000
10011
10001
01111
00000
01100`,
	'ģ':`
00010
00100
00000
01111
10000
10000
10000
10011
10001
01111
00000
00000`,
	'Ĥ':`
00100
01010
00000
10001
10001
11111
10001
10001
10001
10001
00000
00000`,
	'ĥ':`
00100
01010
00000
10000
10000
11110
10001
10001
10001
10001
00000
00000`,
	'Ħ':`
00000
00000
01010
11111
01010
01110
01010
01010
01010
01010
00000
00000`,
	'ħ':`
00000
00000
01000
11100
01000
01110
01001
01001
01001
01001
00000
00000`,
	'Ĩ':`
01001
10110
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'ĩ':`
01010
10100
00000
00100
00000
01100
00100
00100
00100
01110
00000
00000`,
	'Ī':`
00000
01110
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'ī':`
00000
00000
00000
01110
00000
01100
00100
00100
00100
01110
00000
00000`,
	'Ĭ':`
01010
00100
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'ĭ':`
00000
00000
01010
00100
00000
01100
00100
00100
00100
01110
00000
00000`,
	'Į':`
00000
00000
00000
11111
00100
00100
00100
00100
00100
11111
00010
00001`,
	'į':`
00000
00000
00000
00100
00000
01100
00100
00100
00100
01110
00010
00001`,
	'İ':`
00000
00100
00000
11111
00100
00100
00100
00100
00100
11111
00000
00000`,
	'ı':`
00000
00000
00000
00000
00000
01100
00100
00100
00100
01110
00000
00000`,
	'Ĳ':`
00000
00000
00000
10010
10010
10010
10010
10010
10010
10110
00000
00000`,
	'ĳ':`
00000
00000
00000
01001
00000
11001
01001
01001
01001
11101
00001
00010`,
	'Ĵ':`
00010
00101
00000
01111
00001
00001
00001
00001
00001
01110
00000
00000`,
	'ĵ':`
00000
00000
00100
01010
00000
01100
00100
00100
00100
00100
10100
01000`,
	'Ķ':`
00000
00000
00000
10001
10010
10100
11000
10100
10010
10001
00100
01000`,
	'ķ':`
00000
00000
00000
10000
10000
10001
10010
11100
10010
10001
00100
01000`,
	'ĸ':`
00000
00000
00000
00000
00000
10001
10010
11100
10010
10001
00000
00000`,
	'Ĺ':`
00000
00010
00100
10000
10000
10000
10000
10000
10000
11111
00000
00000`,
	'ĺ':`
00010
00100
00000
01100
00100
00100
00100
00100
00100
01110
00000
00000`,
	'Ļ':`
00000
00000
00000
10000
10000
10000
10000
10000
10000
11111
00000
00100`,
	'ļ':`
00000
00000
00000
01100
00100
00100
00100
00100
00100
01110
00000
00100`,
	'Ľ':`
00000
00000
00000
10010
10010
10000
10000
10000
10000
11111
00000
00000`,
	'ľ':`
00000
00000
00000
01101
00101
00100
00100
00100
00100
01110
00000
00000`,
	'Ŀ':`
00000
00000
00000
10000
10000
10100
10000
10000
10000
11111
00000
00000`,
	'ŀ':`
00000
00000
00000
01100
00100
00100
00101
00100
00100
01110
00000
00000`,
	'Ł':`
00000
00000
00000
01000
01010
01100
11000
01000
01000
01111
00000
00000`,
	'ł':`
00000
00000
00000
01100
00100
00100
00110
01100
00100
01110
00000
00000`,
	'Ń':`
00000
00010
00100
10001
11001
10101
10011
10001
10001
10001
00000
00000`,
	'ń':`
00000
00000
00010
00100
00000
01110
10001
10001
10001
10001
00000
00000`,
	'Ņ':`
00000
00000
00000
10001
11001
10101
10011
10001
10001
10001
00100
01000`,
	'ņ':`
00000
00000
00000
00000
00000
01110
10001
10001
10001
10001
00100
01000`,
	'Ň':`
00000
01010
00100
10001
11001
10101
10011
10001
10001
10001
00000
00000`,
	'ň':`
00000
00000
01010
00100
00000
01110
10001
10001
10001
10001
00000
00000`,
	'ŉ':`
00000
00000
00000
10000
10000
00110
01001
01001
01001
01001
00000
00000`,
	'Ŋ':`
00000
00000
00000
10001
11001
10101
10011
10001
10001
10001
00001
00010`,
	'ŋ':`
00000
00000
00000
00000
00000
01110
10001
10001
10001
10001
00001
00010`,
	'Ō':`
00000
01110
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ō':`
00000
00000
00000
01110
00000
01110
10001
10001
10001
01110
00000
00000`,
	'Ŏ':`
01010
00100
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ŏ':`
00000
00000
01010
00100
00000
01110
10001
10001
10001
01110
00000
00000`,
	'Ő':`
01001
10010
00000
01110
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ő':`
00000
00000
01001
10010
00000
01110
10001
10001
10001
01110
00000
00000`,
	'Œ':`
00000
00000
00000
01111
10100
10100
10111
10100
10100
01111
00000
00000`,
	'œ':`
00000
00000
00000
00000
00000
01110
10101
10110
10100
01111
00000
00000`,
	'Ŕ':`
00010
00100
00000
11110
10001
10001
11110
10001
10001
10001
00000
00000`,
	'ŕ':`
00000
00000
00010
00100
00000
01111
10000
10000
10000
10000
00000
00000`,
	'Ŗ':`
00000
00000
00000
11110
10001
10001
11110
10001
10001
10001
00100
01000`,
	'ŗ':`
00000
00000
00000
00000
00000
01111
10000
10000
10000
10000
00100
01000`,
	'Ř':`
01010
00100
00000
11110
10001
10001
11110
10001
10001
10001
00000
00000`,
	'ř':`
00000
00000
01010
00100
00000
01111
10000
10000
10000
10000
00000
00000`,
	'Ś':`
00010
00100
00000
01111
10000
01110
00001
00001
00001
11110
00000
00000`,
	'ś':`
00000
00000
00010
00100
00000
01111
10000
01110
00001
11110
00000
00000`,
	'Ŝ':`
00100
01010
00000
01111
10000
01110
00001
00001
00001
11110
00000
00000`,
	'ŝ':`
00000
00000
00100
01010
00000
01111
10000
01110
00001
11110
00000
00000`,
	'Ş':`
00000
00000
00000
01111
10000
01110
00001
00001
00001
11110
00100
00000`,
	'ş':`
00000
00000
00000
00000
00000
01111
10000
01110
00001
11110
00100
01000`,
	'Š':`
01010
00100
00000
01111
10000
01110
00001
00001
00001
11110
00000
00000`,
	'š':`
00000
00000
01010
00100
00000
01111
10000
01110
00001
11110
00000
00000`,
	'Ţ':`
00000
00000
00000
11111
00100
00100
00100
00100
00100
00100
00010
00100`,
	'ţ':`
00000
00000
00000
00100
00100
11111
00100
00100
00100
00011
00000
01100`,
	'Ť':`
01010
00100
00000
11111
00100
00100
00100
00100
00100
00100
00000
00000`,
	'ť':`
00000
00000
00001
00101
00100
11111
00100
00100
00100
00011
00000
00000`,
	'Ŧ':`
00000
00000
00000
11111
00100
00100
01110
00100
00100
00100
00000
00000`,
	'ŧ':`
00000
00000
00000
00100
00100
11111
00100
01110
00100
00011
00000
00000`,
	'Ũ':`
01001
10110
00000
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ũ':`
00000
00000
01001
10110
00000
10001
10001
10001
10001
01111
00000
00000`,
	'Ū':`
00000
01110
00000
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ū':`
00000
00000
00000
01110
00000
10001
10001
10001
10001
01111
00000
00000`,
	'Ŭ':`
01010
00100
00000
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ŭ':`
00000
00000
01010
00100
00000
10001
10001
10001
10001
01111
00000
00000`,
	'Ů':`
00100
01010
00100
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ů':`
00000
00000
00100
01010
00100
10001
10001
10001
10001
01111
00000
00000`,
	'Ű':`
01001
10010
00000
10001
10001
10001
10001
10001
10001
01110
00000
00000`,
	'ű':`
00000
00000
01001
10010
00000
10001
10001
10001
10001
01111
00000
00000`,
	'Ų':`
00000
00000
00000
10001
10001
10001
10001
10001
10001
01110
00100
00010`,
	'ų':`
00000
00000
00000
00000
00000
10001
10001
10001
10001
01111
00010
00001`,
	'Ŵ':`
00100
01010
00000
10101
10101
10101
10101
10101
10101
01010
00000
00000`,
	'ŵ':`
00000
00000
00100
01010
00000
10101
10101
10101
10101
01010
00000
00000`,
	'Ŷ':`
00100
01010
00000
10001
10001
01010
00100
00100
00100
00100
00000
00000`,
	'ŷ':`
00000
00000
00100
01010
00000
10001
10001
10001
10001
01111
00001
11110`,
	'Ÿ':`
00000
01010
00000
10001
10001
01010
00100
00100
00100
00100
00000
00000`,
	'Ź':`
00010
00100
00000
11111
00001
00010
00100
01000
10000
11111
00000
00000`,
	'ź':`
00000
00000
00010
00100
00000
11111
00010
00100
01000
11111
00000
00000`,
	'Ż':`
00000
00100
00000
11111
00001
00010
00100
01000
10000
11111
00000
00000`,
	'ż':`
00000
00000
00000
00100
00000
11111
00010
00100
01000
11111
00000
00000`,
	'Ž':`
01010
00100
00000
11111
00001
00010
00100
01000
10000
11111
00000
00000`,
	'ž':`
00000
00000
01010
00100
00000
11111
00010
00100
01000
11111
00000
00000`,
	
	'€':`
00000
00000
00000
00111
01000
11110
01000
11110
01000
00111
00000
00000`,
	
	'™':`
00000
11111
00100
00100
00100
00000
01010
10101
10101
10101
00000
00000`,
	'¢':`
00000
00000
00000
00010
00100
01111
10100
10100
10100
01111
00100
01000`,
	
	'¤':`
00000
00000
00000
00000
10001
01110
10001
10001
01110
10001
00000
00000`,
	'¥':`
00000
00000
10001
01010
00100
01110
00100
01110
00100
00000
00000`,
	
	'§':`
00000
00000
00000
01110
10000
01110
10001
01110
00001
01110
00000
00000`,
	'¨':`
00000
00000
00000
01010
00000
00000
00000
00000
00000
00000
00000
00000`,
	'©':`
00000
00000
00000
01110
10001
10111
10101
10111
10001
01110
00000
00000`,
	'®':`
00000
00000
00000
01110
10001
10111
10101
10101
10001
01110
00000
00000`,
	'ª':`
00000
01110
00010
01110
01010
01110
00000
00000
00000
00000
00000
00000`,
	'º':`
00000
00100
01010
01010
01010
00100
00000
00000
00000
00000
00000
00000`,
	
	'¬':`
00000
00000
00000
00000
00000
00000
00000
01110
00010
00000
00000
00000`,
	'¯':`
00000
00000
00000
01110
00000
00000
00000
00000
00000
00000
00000
00000`,
	'°':`
00000
00000
00100
01010
00100
00000
00000
00000
00000
00000
00000
00000`,
	'✓':`
00000
00000
00000
00000
00000
00001
00010
10100
01000
00000
00000
00000`,
}

var fontKeys = Object.keys(font);

var fontIndex = {};
for (var i = 0; i < fontKeys.length; i++) {
	fontIndex[fontKeys[i]] = i;
}
// @@end js/font.js


// @@begin js/rng.js
/**
 * Seedable random number generator functions.
 * @version 1.0.0
 * @license Public Domain
 *
 * @example
 * var rng = new RNG('Example');
 * rng.random(40, 50);  // =>  42
 * rng.uniform();       // =>  0.7972798995050903
 * rng.normal();        // => -0.6698504543216376
 * rng.exponential();   // =>  1.0547367609131555
 * rng.poisson(4);      // =>  2
 * rng.gamma(4);        // =>  2.781724687386858
 */

/**
 * Get the underlying bytes of this string.
 * @return {Array} An array of bytes
 */
String.prototype.getBytes = function() {
    var output = [];
    for (var i = 0; i < this.length; i++) {
        var c = this.charCodeAt(i);
        var bytes = [];
        do {
            bytes.push(c & 0xFF);
            c = c >> 8;
        } while (c > 0);
        output = output.concat(bytes.reverse());
    }
    return output;
};

/**
 * @param {String} seed A string to seed the generator.
 * @constructor
 */
function RC4(seed) {
    this.s = new Array(256);
    this.i = 0;
    this.j = 0;
    for (var i = 0; i < 256; i++) {
        this.s[i] = i;
    }
    if (seed) {
        this.mix(seed);
    }
}

RC4.prototype._swap = function(i, j) {
    var tmp = this.s[i];
    this.s[i] = this.s[j];
    this.s[j] = tmp;
};

/**
 * Mix additional entropy into this generator.
 * @param {String} seed
 */
RC4.prototype.mix = function(seed) {
    var input = seed.getBytes();
    var j = 0;
    for (var i = 0; i < this.s.length; i++) {
        j += this.s[i] + input[i % input.length];
        j %= 256;
        this._swap(i, j);
    }
};

/**
 * @return {number} The next byte of output from the generator.
 */
RC4.prototype.next = function() {
    this.i = (this.i + 1) % 256;
    this.j = (this.j + this.s[this.i]) % 256;
    this._swap(this.i, this.j);
    return this.s[(this.s[this.i] + this.s[this.j]) % 256];
};

function print_call_stack() {
  var e = new Error();
  var stack = e.stack;
  console.log( stack );
}
/**
 * Create a new random number generator with optional seed. If the
 * provided seed is a function (i.e. Math.random) it will be used as
 * the uniform number generator.
 * @param seed An arbitrary object used to seed the generator.
 * @constructor
 */
function RNG(seed) {
    this.seed = seed;
    if (seed == null) {
        seed = (Math.random() + Date.now()).toString();
        //window.console.log("setting random seed "+seed); 
        //print_call_stack();  

    } else if (typeof seed === 'function') {
        // Use it as a uniform number generator
        this.uniform = seed;
        this.nextByte = function() {
            return ~~(this.uniform() * 256);
        };
        seed = null;
    } else if (Object.prototype.toString.call(seed) !== '[object String]') {
        seed = JSON.stringify(seed);
    } else {
        //window.console.log("setting seed "+seed);
        //print_call_stack();
    }
    this._normal = null;
    if (seed) {
        this._state = new RC4(seed);
    } else {
        this._state = null;
    }
}

/**
 * @return {number} Uniform random number between 0 and 255.
 */
RNG.prototype.nextByte = function() {
    return this._state.next();
};

/**
 * @return {number} Uniform random number between 0 and 1.
 */
RNG.prototype.uniform = function() {
    var BYTES = 7; // 56 bits to make a 53-bit double
    var output = 0;
    for (var i = 0; i < BYTES; i++) {
        output *= 256;
        output += this.nextByte();
    }
    return output / (Math.pow(2, BYTES * 8) - 1);
};

/**
 * Produce a random integer within [n, m).
 * @param {number} [n=0]
 * @param {number} m
 *
 */
RNG.prototype.random = function(n, m) {
    if (n == null) {
        return this.uniform();
    } else if (m == null) {
        m = n;
        n = 0;
    }
    return n + Math.floor(this.uniform() * (m - n));
};

/**
 * Generates numbers using this.uniform() with the Box-Muller transform.
 * @return {number} Normally-distributed random number of mean 0, variance 1.
 */
RNG.prototype.normal = function() {
    if (this._normal !== null) {
        var n = this._normal;
        this._normal = null;
        return n;
    } else {
        var x = this.uniform() || Math.pow(2, -53); // can't be exactly 0
        var y = this.uniform();
        this._normal = Math.sqrt(-2 * Math.log(x)) * Math.sin(2 * Math.PI * y);
        return Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y);
    }
};

/**
 * Generates numbers using this.uniform().
 * @return {number} Number from the exponential distribution, lambda = 1.
 */
RNG.prototype.exponential = function() {
    return -Math.log(this.uniform() || Math.pow(2, -53));
};

/**
 * Generates numbers using this.uniform() and Knuth's method.
 * @param {number} [mean=1]
 * @return {number} Number from the Poisson distribution.
 */
RNG.prototype.poisson = function(mean) {
    var L = Math.exp(-(mean || 1));
    var k = 0, p = 1;
    do {
        k++;
        p *= this.uniform();
    } while (p > L);
    return k - 1;
};

/**
 * Generates numbers using this.uniform(), this.normal(),
 * this.exponential(), and the Marsaglia-Tsang method.
 * @param {number} a
 * @return {number} Number from the gamma distribution.
 */
RNG.prototype.gamma = function(a) {
    var d = (a < 1 ? 1 + a : a) - 1 / 3;
    var c = 1 / Math.sqrt(9 * d);
    do {
        do {
            var x = this.normal();
            var v = Math.pow(c * x + 1, 3);
        } while (v <= 0);
        var u = this.uniform();
        var x2 = Math.pow(x, 2);
    } while (u >= 1 - 0.0331 * x2 * x2 &&
             Math.log(u) >= 0.5 * x2 + d * (1 - v + Math.log(v)));
    if (a < 1) {
        return d * v * Math.exp(this.exponential() / -a);
    } else {
        return d * v;
    }
};

/**
 * Accepts a dice rolling notation string and returns a generator
 * function for that distribution. The parser is quite flexible.
 * @param {string} expr A dice-rolling, expression i.e. '2d6+10'.
 * @param {RNG} rng An optional RNG object.
 * @return {Function}
 */
RNG.roller = function(expr, rng) {
    var parts = expr.split(/(\d+)?d(\d+)([+-]\d+)?/).slice(1);
    var dice = parseFloat(parts[0]) || 1;
    var sides = parseFloat(parts[1]);
    var mod = parseFloat(parts[2]) || 0;
    rng = rng || new RNG();
    return function() {
        var total = dice + mod;
        for (var i = 0; i < dice; i++) {
            total += rng.random(sides);
        }
        return total;
    };
};
// @@end js/rng.js


// @@begin js/riffwave.js
/*
 * RIFFWAVE.js v0.02 - Audio encoder for HTML5 <audio> elements.
 * Copyright (C) 2011 Pedro Ladaria <pedro.ladaria at Gmail dot com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *
 * Changelog:
 *
 * 0.01 - First release
 * 0.02 - New faster base64 encoding
 *
 */

var FastBase64_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var FastBase64_encLookup = [];

function FastBase64_Init() {
  for (var i = 0; i < 4096; i++) {
    FastBase64_encLookup[i] = FastBase64_chars[i >> 6] + FastBase64_chars[i & 0x3F];
  }
}

function FastBase64_Encode(src) {
  var len = src.length;
  var dst = '';
  var i = 0;
  while (len > 2) {
    n = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2];
    dst += FastBase64_encLookup[n >> 12] + FastBase64_encLookup[n & 0xFFF];
    len -= 3;
    i += 3;
  }
  if (len > 0) {
    var n1 = (src[i] & 0xFC) >> 2;
    var n2 = (src[i] & 0x03) << 4;
    if (len > 1) n2 |= (src[++i] & 0xF0) >> 4;
    dst += FastBase64_chars[n1];
    dst += FastBase64_chars[n2];
    if (len == 2) {
      var n3 = (src[i++] & 0x0F) << 2;
      n3 |= (src[i] & 0xC0) >> 6;
      dst += FastBase64_chars[n3];
    }
    if (len == 1) dst += '=';
    dst += '=';
  }
  return dst;
} // end Encode

FastBase64_Init();

function u32ToArray(i) { return [i & 0xFF, (i >> 8) & 0xFF, (i >> 16) & 0xFF, (i >> 24) & 0xFF]; }

function u16ToArray(i) { return [i & 0xFF, (i >> 8) & 0xFF]; }

function MakeRiff ( sampleRate, bitsPerSample,data) {
  var dat = [];
  var wav=[];
  var dataURI=[];

  var header = {                         // OFFS SIZE NOTES
    chunkId: [0x52, 0x49, 0x46, 0x46], // 0    4    "RIFF" = 0x52494646
    chunkSize: 0,                     // 4    4    36+SubChunk2Size = 4+(8+SubChunk1Size)+(8+SubChunk2Size)
    format: [0x57, 0x41, 0x56, 0x45], // 8    4    "WAVE" = 0x57415645
    subChunk1Id: [0x66, 0x6d, 0x74, 0x20], // 12   4    "fmt " = 0x666d7420
    subChunk1Size: 16,                    // 16   4    16 for PCM
    audioFormat: 1,                     // 20   2    PCM = 1
    numChannels: 1,                     // 22   2    Mono = 1, Stereo = 2, etc.
    sampleRate: sampleRate,                  // 24   4    8000, 44100, etc
    byteRate: 0,                     // 28   4    SampleRate*NumChannels*BitsPerSample/8
    blockAlign: 0,                     // 32   2    NumChannels*BitsPerSample/8
    bitsPerSample: bitsPerSample,                     // 34   2    8 bits = 8, 16 bits = 16, etc...
    subChunk2Id: [0x64, 0x61, 0x74, 0x61], // 36   4    "data" = 0x64617461
    subChunk2Size: 0                      // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
  };

  header.byteRate = (header.sampleRate * header.numChannels * header.bitsPerSample) >> 3;
  header.blockAlign = (header.numChannels * header.bitsPerSample) >> 3;
  header.subChunk2Size = data.length;
  header.chunkSize = 36 + header.subChunk2Size;

  wav = header.chunkId.concat(
      u32ToArray(header.chunkSize),
      header.format,
      header.subChunk1Id,
      u32ToArray(header.subChunk1Size),
      u16ToArray(header.audioFormat),
      u16ToArray(header.numChannels),
      u32ToArray(header.sampleRate),
      u32ToArray(header.byteRate),
      u16ToArray(header.blockAlign),
      u16ToArray(header.bitsPerSample),
      header.subChunk2Id,
      u32ToArray(header.subChunk2Size),
      data
    );
    
    dataURI = 'data:audio/wav;base64,' + FastBase64_Encode(wav);

    var result = {
      dat:dat,
      wav:wav,
      header:header,
      dataURI:dataURI
    };

    return result;
}


if (typeof exports != 'undefined')  // For node.js
  exports.RIFFWAVE = RIFFWAVE;

// @@end js/riffwave.js


// @@begin js/sfxr.js
var SOUND_VOL = 0.25;
var SAMPLE_RATE = 5512;
var BIT_DEPTH = 8;

var SQUARE = 0;
var SAWTOOTH = 1;
var SINE = 2;
var NOISE = 3;
var TRIANGLE = 4;
var BREAKER = 5;

var SHAPES = [
  'square', 'sawtooth', 'sine', 'noise', 'triangle', 'breaker'
];

var AUDIO_CONTEXT;

function checkAudioContextExists(){
  try{
    if (AUDIO_CONTEXT==null){
      if (typeof AudioContext != 'undefined') {
        AUDIO_CONTEXT = new AudioContext();
      } else if (typeof webkitAudioContext != 'undefined') {
        AUDIO_CONTEXT = new webkitAudioContext();
      }
    }
  }
  catch (ex){
    window.console.log(ex)
  }
}

checkAudioContextExists();

// Playback volume
var masterVolume = 1.0;

// Sound generation parameters are on [0,1] unless noted SIGNED, & thus [-1,1]
function Params() {
  var result={};
  // Wave shape
  result.wave_type = SQUARE;

  // Envelope
  result.p_env_attack = 0.0;   // Attack time
  result.p_env_sustain = 0.3;  // Sustain time
  result.p_env_punch = 0.0;    // Sustain punch
  result.p_env_decay = 0.4;    // Decay time

  // Tone
  result.p_base_freq = 0.3;    // Start frequency
  result.p_freq_limit = 0.0;   // Min frequency cutoff
  result.p_freq_ramp = 0.0;    // Slide (SIGNED)
  result.p_freq_dramp = 0.0;   // Delta slide (SIGNED)
  // Vibrato
  result.p_vib_strength = 0.0; // Vibrato depth
  result.p_vib_speed = 0.0;    // Vibrato speed

  // Tonal change
  result.p_arp_mod = 0.0;      // Change amount (SIGNED)
  result.p_arp_speed = 0.0;    // Change speed

  // Duty (wat's that?)
  result.p_duty = 0.0;         // Square duty
  result.p_duty_ramp = 0.0;    // Duty sweep (SIGNED)

  // Repeat
  result.p_repeat_speed = 0.0; // Repeat speed

  // Phaser
  result.p_pha_offset = 0.0;   // Phaser offset (SIGNED)
  result.p_pha_ramp = 0.0;     // Phaser sweep (SIGNED)

  // Low-pass filter
  result.p_lpf_freq = 1.0;     // Low-pass filter cutoff
  result.p_lpf_ramp = 0.0;     // Low-pass filter cutoff sweep (SIGNED)
  result.p_lpf_resonance = 0.0;// Low-pass filter resonance
  // High-pass filter
  result.p_hpf_freq = 0.0;     // High-pass filter cutoff
  result.p_hpf_ramp = 0.0;     // High-pass filter cutoff sweep (SIGNED)

  // Sample parameters
  result.sound_vol = 0.5;
  result.sample_rate = 44100;
  result.bit_depth = 8;
  return result;
}

var rng;
var seeded = false;
function frnd(range) {
  if (seeded) {
    return rng.uniform() * range;
  } else {
    return Math.random() * range;
  }
}


function rnd(max) {
  if (seeded) {
  return Math.floor(rng.uniform() * (max + 1));
  } else {
    return Math.floor(Math.random() * (max + 1));
  }
}


function pickupCoin() {
  var result=Params();
  result.wave_type = Math.floor(frnd(SHAPES.length));
  if (result.wave_type === 3) {
    result.wave_type = 0;
  }
  result.p_base_freq = 0.4 + frnd(0.5);
  result.p_env_attack = 0.0;
  result.p_env_sustain = frnd(0.1);
  result.p_env_decay = 0.1 + frnd(0.4);
  result.p_env_punch = 0.3 + frnd(0.3);
  if (rnd(1)) {
    result.p_arp_speed = 0.5 + frnd(0.2);
    var num = (frnd(7) | 1) + 1;
    var den = num + (frnd(7) | 1) + 2;
    result.p_arp_mod = (+num) / (+den); //0.2 + frnd(0.4);
  }
  return result;
};


function laserShoot() {
  var result=Params();
  result.wave_type = rnd(2);
  if (result.wave_type === SINE && rnd(1))
    result.wave_type = rnd(1);
  result.wave_type = Math.floor(frnd(SHAPES.length));

  if (result.wave_type === 3) {
    result.wave_type = SQUARE;
  }

  result.p_base_freq = 0.5 + frnd(0.5);
  result.p_freq_limit = result.p_base_freq - 0.2 - frnd(0.6);
  if (result.p_freq_limit < 0.2) result.p_freq_limit = 0.2;
  result.p_freq_ramp = -0.15 - frnd(0.2);
  if (rnd(2) === 0)
  {
    result.p_base_freq = 0.3 + frnd(0.6);
    result.p_freq_limit = frnd(0.1);
    result.p_freq_ramp = -0.35 - frnd(0.3);
  }
  if (rnd(1))
  {
    result.p_duty = frnd(0.5);
    result.p_duty_ramp = frnd(0.2);
  }
  else
  {
    result.p_duty = 0.4 + frnd(0.5);
    result.p_duty_ramp = -frnd(0.7);
  }
  result.p_env_attack = 0.0;
  result.p_env_sustain = 0.1 + frnd(0.2);
  result.p_env_decay = frnd(0.4);
  if (rnd(1))
    result.p_env_punch = frnd(0.3);
  if (rnd(2) === 0)
  {
    result.p_pha_offset = frnd(0.2);
    result.p_pha_ramp = -frnd(0.2);
  }
  if (rnd(1))
    result.p_hpf_freq = frnd(0.3);

  return result;
};

function explosion() {
  var result=Params();

  if (rnd(1)) {
    result.p_base_freq = 0.1 + frnd(0.4);
    result.p_freq_ramp = -0.1 + frnd(0.4);
  } else {
    result.p_base_freq = 0.2 + frnd(0.7);
    result.p_freq_ramp = -0.2 - frnd(0.2);
  }
  result.p_base_freq *= result.p_base_freq;
  if (rnd(4) === 0)
    result.p_freq_ramp = 0.0;
  if (rnd(2) === 0)
    result.p_repeat_speed = 0.3 + frnd(0.5);
  result.p_env_attack = 0.0;
  result.p_env_sustain = 0.1 + frnd(0.3);
  result.p_env_decay = frnd(0.5);
  if (rnd(1) === 0) {
    result.p_pha_offset = -0.3 + frnd(0.9);
    result.p_pha_ramp = -frnd(0.3);
  }
  result.p_env_punch = 0.2 + frnd(0.6);
  if (rnd(1)) {
    result.p_vib_strength = frnd(0.7);
    result.p_vib_speed = frnd(0.6);
  }
  if (rnd(2) === 0) {
    result.p_arp_speed = 0.6 + frnd(0.3);
    result.p_arp_mod = 0.8 - frnd(1.6);
  }

  return result;
};
//9675111
function birdSound() {
  var result=Params();

if (frnd(10) < 1) {
    result.wave_type = Math.floor(frnd(SHAPES.length));
    if (result.wave_type === 3) {
      result.wave_type = SQUARE;
    }
result.p_env_attack = 0.4304400932967592 + frnd(0.2) - 0.1;
result.p_env_sustain = 0.15739346034252394 + frnd(0.2) - 0.1;
result.p_env_punch = 0.004488201744871758 + frnd(0.2) - 0.1;
result.p_env_decay = 0.07478075528212291 + frnd(0.2) - 0.1;
result.p_base_freq = 0.9865265720147687 + frnd(0.2) - 0.1;
result.p_freq_limit = 0 + frnd(0.2) - 0.1;
result.p_freq_ramp = -0.2995018224359539 + frnd(0.2) - 0.1;
if (frnd(1.0) < 0.5) {
  result.p_freq_ramp = 0.1 + frnd(0.15);
}
result.p_freq_dramp = 0.004598608156964473 + frnd(0.1) - 0.05;
result.p_vib_strength = -0.2202799497929496 + frnd(0.2) - 0.1;
result.p_vib_speed = 0.8084998703158364 + frnd(0.2) - 0.1;
result.p_arp_mod = 0;//-0.46410459213693644+frnd(0.2)-0.1;
result.p_arp_speed = 0;//-0.10955361249587248+frnd(0.2)-0.1;
result.p_duty = -0.9031808754347107 + frnd(0.2) - 0.1;
result.p_duty_ramp = -0.8128699999808343 + frnd(0.2) - 0.1;
result.p_repeat_speed = 0.6014860189319991 + frnd(0.2) - 0.1;
result.p_pha_offset = -0.9424902314367765 + frnd(0.2) - 0.1;
result.p_pha_ramp = -0.1055482222272056 + frnd(0.2) - 0.1;
result.p_lpf_freq = 0.9989765717851521 + frnd(0.2) - 0.1;
result.p_lpf_ramp = -0.25051720626043017 + frnd(0.2) - 0.1;
result.p_lpf_resonance = 0.32777871505494693 + frnd(0.2) - 0.1;
result.p_hpf_freq = 0.0023548750981756753 + frnd(0.2) - 0.1;
result.p_hpf_ramp = -0.002375673204842568 + frnd(0.2) - 0.1;
return result;
}

if (frnd(10) < 1) {
    result.wave_type = Math.floor(frnd(SHAPES.length));
    if (result.wave_type === 3) {
      result.wave_type = SQUARE;
    }
result.p_env_attack = 0.5277795946672003 + frnd(0.2) - 0.1;
result.p_env_sustain = 0.18243733568468432 + frnd(0.2) - 0.1;
result.p_env_punch = -0.020159754546840117 + frnd(0.2) - 0.1;
result.p_env_decay = 0.1561353422051903 + frnd(0.2) - 0.1;
result.p_base_freq = 0.9028855606533718 + frnd(0.2) - 0.1;
result.p_freq_limit = -0.008842787837148716;
result.p_freq_ramp = -0.1;
result.p_freq_dramp = -0.012891241489551925;
result.p_vib_strength = -0.17923136138403065 + frnd(0.2) - 0.1;
result.p_vib_speed = 0.908263385610142 + frnd(0.2) - 0.1;
result.p_arp_mod = 0.41690153355414894 + frnd(0.2) - 0.1;
result.p_arp_speed = 0.0010766233195860703 + frnd(0.2) - 0.1;
result.p_duty = -0.8735363011184684 + frnd(0.2) - 0.1;
result.p_duty_ramp = -0.7397985366747507 + frnd(0.2) - 0.1;
result.p_repeat_speed = 0.0591789344172107 + frnd(0.2) - 0.1;
result.p_pha_offset = -0.9961184222777699 + frnd(0.2) - 0.1;
result.p_pha_ramp = -0.08234769395850523 + frnd(0.2) - 0.1;
result.p_lpf_freq = 0.9412475115697335 + frnd(0.2) - 0.1;
result.p_lpf_ramp = -0.18261358925834958 + frnd(0.2) - 0.1;
result.p_lpf_resonance = 0.24541438107389477 + frnd(0.2) - 0.1;
result.p_hpf_freq = -0.01831940280978611 + frnd(0.2) - 0.1;
result.p_hpf_ramp = -0.03857383633171346 + frnd(0.2) - 0.1;
return result;

}
  if (frnd(10) < 1) {
//result.wave_type = 4;
    result.wave_type = Math.floor(frnd(SHAPES.length));

    if (result.wave_type === 3) {
      result.wave_type = SQUARE;
    }
result.p_env_attack = 0.4304400932967592 + frnd(0.2) - 0.1;
result.p_env_sustain = 0.15739346034252394 + frnd(0.2) - 0.1;
result.p_env_punch = 0.004488201744871758 + frnd(0.2) - 0.1;
result.p_env_decay = 0.07478075528212291 + frnd(0.2) - 0.1;
result.p_base_freq = 0.9865265720147687 + frnd(0.2) - 0.1;
result.p_freq_limit = 0 + frnd(0.2) - 0.1;
result.p_freq_ramp = -0.2995018224359539 + frnd(0.2) - 0.1;
result.p_freq_dramp = 0.004598608156964473 + frnd(0.2) - 0.1;
result.p_vib_strength = -0.2202799497929496 + frnd(0.2) - 0.1;
result.p_vib_speed = 0.8084998703158364 + frnd(0.2) - 0.1;
result.p_arp_mod = -0.46410459213693644 + frnd(0.2) - 0.1;
result.p_arp_speed = -0.10955361249587248 + frnd(0.2) - 0.1;
result.p_duty = -0.9031808754347107 + frnd(0.2) - 0.1;
result.p_duty_ramp = -0.8128699999808343 + frnd(0.2) - 0.1;
result.p_repeat_speed = 0.7014860189319991 + frnd(0.2) - 0.1;
result.p_pha_offset = -0.9424902314367765 + frnd(0.2) - 0.1;
result.p_pha_ramp = -0.1055482222272056 + frnd(0.2) - 0.1;
result.p_lpf_freq = 0.9989765717851521 + frnd(0.2) - 0.1;
result.p_lpf_ramp = -0.25051720626043017 + frnd(0.2) - 0.1;
result.p_lpf_resonance = 0.32777871505494693 + frnd(0.2) - 0.1;
result.p_hpf_freq = 0.0023548750981756753 + frnd(0.2) - 0.1;
result.p_hpf_ramp = -0.002375673204842568 + frnd(0.2) - 0.1;
return result;
}
  if (frnd(5) > 1) {
    result.wave_type = Math.floor(frnd(SHAPES.length));

    if (result.wave_type === 3) {
      result.wave_type = SQUARE;
    }
    if (rnd(1)) {
      result.p_arp_mod = 0.2697849293151393 + frnd(0.2) - 0.1;
      result.p_arp_speed = -0.3131172257760948 + frnd(0.2) - 0.1;
      result.p_base_freq = 0.8090588299313949 + frnd(0.2) - 0.1;
      result.p_duty = -0.6210022920964955 + frnd(0.2) - 0.1;
      result.p_duty_ramp = -0.00043441813553182567 + frnd(0.2) - 0.1;
      result.p_env_attack = 0.004321877246874195 + frnd(0.2) - 0.1;
      result.p_env_decay = 0.1 + frnd(0.2) - 0.1;
      result.p_env_punch = 0.061737781504416146 + frnd(0.2) - 0.1;
      result.p_env_sustain = 0.4987252564798832 + frnd(0.2) - 0.1;
      result.p_freq_dramp = 0.31700340314222614 + frnd(0.2) - 0.1;
      result.p_freq_limit = 0 + frnd(0.2) - 0.1;
      result.p_freq_ramp = -0.163380391341416 + frnd(0.2) - 0.1;
      result.p_hpf_freq = 0.4709005021145149 + frnd(0.2) - 0.1;
      result.p_hpf_ramp = 0.6924667290539194 + frnd(0.2) - 0.1;
      result.p_lpf_freq = 0.8351398631384511 + frnd(0.2) - 0.1;
      result.p_lpf_ramp = 0.36616557192873134 + frnd(0.2) - 0.1;
      result.p_lpf_resonance = -0.08685777111664439 + frnd(0.2) - 0.1;
      result.p_pha_offset = -0.036084571580025544 + frnd(0.2) - 0.1;
      result.p_pha_ramp = -0.014806445085568108 + frnd(0.2) - 0.1;
      result.p_repeat_speed = -0.8094368475518489 + frnd(0.2) - 0.1;
      result.p_vib_speed = 0.4496665457171294 + frnd(0.2) - 0.1;
      result.p_vib_strength = 0.23413762515532424 + frnd(0.2) - 0.1;
    } else {
      result.p_arp_mod = -0.35697118026766184 + frnd(0.2) - 0.1;
      result.p_arp_speed = 0.3581140690559588 + frnd(0.2) - 0.1;
      result.p_base_freq = 1.3260897696157528 + frnd(0.2) - 0.1;
      result.p_duty = -0.30984900436710694 + frnd(0.2) - 0.1;
      result.p_duty_ramp = -0.0014374759133411626 + frnd(0.2) - 0.1;
      result.p_env_attack = 0.3160357835682254 + frnd(0.2) - 0.1;
      result.p_env_decay = 0.1 + frnd(0.2) - 0.1;
      result.p_env_punch = 0.24323114016870148 + frnd(0.2) - 0.1;
      result.p_env_sustain = 0.4 + frnd(0.2) - 0.1;
      result.p_freq_dramp = 0.2866475886237244 + frnd(0.2) - 0.1;
      result.p_freq_limit = 0 + frnd(0.2) - 0.1;
      result.p_freq_ramp = -0.10956352368742976 + frnd(0.2) - 0.1;
      result.p_hpf_freq = 0.20772718017889846 + frnd(0.2) - 0.1;
      result.p_hpf_ramp = 0.1564090637378835 + frnd(0.2) - 0.1;
      result.p_lpf_freq = 0.6021372770637031 + frnd(0.2) - 0.1;
      result.p_lpf_ramp = 0.24016227139979027 + frnd(0.2) - 0.1;
      result.p_lpf_resonance = -0.08787383821160144 + frnd(0.2) - 0.1;
      result.p_pha_offset = -0.381597686151701 + frnd(0.2) - 0.1;
      result.p_pha_ramp = -0.0002481687661373495 + frnd(0.2) - 0.1;
      result.p_repeat_speed = 0.07812112809425686 + frnd(0.2) - 0.1;
      result.p_vib_speed = -0.13648848579133943 + frnd(0.2) - 0.1;
      result.p_vib_strength = 0.0018874158972302657 + frnd(0.2) - 0.1;
    }
    return result;

  }

  result.wave_type = Math.floor(frnd(SHAPES.length));//TRIANGLE;
  if (result.wave_type === 1 || result.wave_type === 3) {
    result.wave_type = 2;
  }
  //new
  result.p_base_freq = 0.85 + frnd(0.15);
  result.p_freq_ramp = 0.3 + frnd(0.15);
//  result.p_freq_dramp = 0.3+frnd(2.0);

  result.p_env_attack = 0 + frnd(0.09);
  result.p_env_sustain = 0.2 + frnd(0.3);
  result.p_env_decay = 0 + frnd(0.1);

  result.p_duty = frnd(2.0) - 1.0;
  result.p_duty_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);


  result.p_repeat_speed = 0.5 + frnd(0.1);

  result.p_pha_offset = -0.3 + frnd(0.9);
  result.p_pha_ramp = -frnd(0.3);

  result.p_arp_speed = 0.4 + frnd(0.6);
  result.p_arp_mod = 0.8 + frnd(0.1);


  result.p_lpf_resonance = frnd(2.0) - 1.0;
  result.p_lpf_freq = 1.0 - Math.pow(frnd(1.0), 3.0);
  result.p_lpf_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  if (result.p_lpf_freq < 0.1 && result.p_lpf_ramp < -0.05)
    result.p_lpf_ramp = -result.p_lpf_ramp;
  result.p_hpf_freq = Math.pow(frnd(1.0), 5.0);
  result.p_hpf_ramp = Math.pow(frnd(2.0) - 1.0, 5.0);

  return result;
};


function pushSound() {
  var result=Params();
  result.wave_type = Math.floor(frnd(SHAPES.length));//TRIANGLE;
  if (result.wave_type === 2) {
    result.wave_type++;
  }
  if (result.wave_type === 0) {
    result.wave_type = NOISE;
  }
  //new
  result.p_base_freq = 0.1 + frnd(0.4);
  result.p_freq_ramp = 0.05 + frnd(0.2);

  result.p_env_attack = 0.01 + frnd(0.09);
  result.p_env_sustain = 0.01 + frnd(0.09);
  result.p_env_decay = 0.01 + frnd(0.09);

  result.p_repeat_speed = 0.3 + frnd(0.5);
  result.p_pha_offset = -0.3 + frnd(0.9);
  result.p_pha_ramp = -frnd(0.3);
  result.p_arp_speed = 0.6 + frnd(0.3);
  result.p_arp_mod = 0.8 - frnd(1.6);

  return result;
};



function powerUp() {
  var result=Params();
  if (rnd(1))
    result.wave_type = SAWTOOTH;
  else
    result.p_duty = frnd(0.6);
  result.wave_type = Math.floor(frnd(SHAPES.length));
  if (result.wave_type === 3) {
    result.wave_type = SQUARE;
  }
  if (rnd(1))
  {
    result.p_base_freq = 0.2 + frnd(0.3);
    result.p_freq_ramp = 0.1 + frnd(0.4);
    result.p_repeat_speed = 0.4 + frnd(0.4);
  }
  else
  {
    result.p_base_freq = 0.2 + frnd(0.3);
    result.p_freq_ramp = 0.05 + frnd(0.2);
    if (rnd(1))
    {
      result.p_vib_strength = frnd(0.7);
      result.p_vib_speed = frnd(0.6);
    }
  }
  result.p_env_attack = 0.0;
  result.p_env_sustain = frnd(0.4);
  result.p_env_decay = 0.1 + frnd(0.4);

  return result;
};

function hitHurt() {
  result = Params();
  result.wave_type = rnd(2);
  if (result.wave_type === SINE)
    result.wave_type = NOISE;
  if (result.wave_type === SQUARE)
    result.p_duty = frnd(0.6);
  result.wave_type = Math.floor(frnd(SHAPES.length));
  result.p_base_freq = 0.2 + frnd(0.6);
  result.p_freq_ramp = -0.3 - frnd(0.4);
  result.p_env_attack = 0.0;
  result.p_env_sustain = frnd(0.1);
  result.p_env_decay = 0.1 + frnd(0.2);
  if (rnd(1))
    result.p_hpf_freq = frnd(0.3);
  return result;
};


function jump() {
  result = Params();
  result.wave_type = SQUARE;
  result.wave_type = Math.floor(frnd(SHAPES.length));
  if (result.wave_type === 3) {
    result.wave_type = SQUARE;
  }
  result.p_duty = frnd(0.6);
  result.p_base_freq = 0.3 + frnd(0.3);
  result.p_freq_ramp = 0.1 + frnd(0.2);
  result.p_env_attack = 0.0;
  result.p_env_sustain = 0.1 + frnd(0.3);
  result.p_env_decay = 0.1 + frnd(0.2);
  if (rnd(1))
    result.p_hpf_freq = frnd(0.3);
  if (rnd(1))
    result.p_lpf_freq = 1.0 - frnd(0.6);
  return result;
};

function blipSelect() {
  result = Params();
  result.wave_type = rnd(1);
  result.wave_type = Math.floor(frnd(SHAPES.length));
  if (result.wave_type === 3) {
    result.wave_type = rnd(1);
  }
  if (result.wave_type === SQUARE)
    result.p_duty = frnd(0.6);
  result.p_base_freq = 0.2 + frnd(0.4);
  result.p_env_attack = 0.0;
  result.p_env_sustain = 0.1 + frnd(0.1);
  result.p_env_decay = frnd(0.2);
  result.p_hpf_freq = 0.1;
  return result;
};

function random() {
  result = Params();
  result.wave_type = Math.floor(frnd(SHAPES.length));
  result.p_base_freq = Math.pow(frnd(2.0) - 1.0, 2.0);
  if (rnd(1))
    result.p_base_freq = Math.pow(frnd(2.0) - 1.0, 3.0) + 0.5;
  result.p_freq_limit = 0.0;
  result.p_freq_ramp = Math.pow(frnd(2.0) - 1.0, 5.0);
  if (result.p_base_freq > 0.7 && result.p_freq_ramp > 0.2)
    result.p_freq_ramp = -result.p_freq_ramp;
  if (result.p_base_freq < 0.2 && result.p_freq_ramp < -0.05)
    result.p_freq_ramp = -result.p_freq_ramp;
  result.p_freq_dramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  result.p_duty = frnd(2.0) - 1.0;
  result.p_duty_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  result.p_vib_strength = Math.pow(frnd(2.0) - 1.0, 3.0);
  result.p_vib_speed = frnd(2.0) - 1.0;
  result.p_env_attack = Math.pow(frnd(2.0) - 1.0, 3.0);
  result.p_env_sustain = Math.pow(frnd(2.0) - 1.0, 2.0);
  result.p_env_decay = frnd(2.0) - 1.0;
  result.p_env_punch = Math.pow(frnd(0.8), 2.0);
  if (result.p_env_attack + result.p_env_sustain + result.p_env_decay < 0.2) {
    result.p_env_sustain += 0.2 + frnd(0.3);
    result.p_env_decay += 0.2 + frnd(0.3);
  }
  result.p_lpf_resonance = frnd(2.0) - 1.0;
  result.p_lpf_freq = 1.0 - Math.pow(frnd(1.0), 3.0);
  result.p_lpf_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  if (result.p_lpf_freq < 0.1 && result.p_lpf_ramp < -0.05)
    result.p_lpf_ramp = -result.p_lpf_ramp;
  result.p_hpf_freq = Math.pow(frnd(1.0), 5.0);
  result.p_hpf_ramp = Math.pow(frnd(2.0) - 1.0, 5.0);
  result.p_pha_offset = Math.pow(frnd(2.0) - 1.0, 3.0);
  result.p_pha_ramp = Math.pow(frnd(2.0) - 1.0, 3.0);
  result.p_repeat_speed = frnd(2.0) - 1.0;
  result.p_arp_speed = frnd(2.0) - 1.0;
  result.p_arp_mod = frnd(2.0) - 1.0;
  return result;
};

var generators = [
pickupCoin,
laserShoot,
explosion,
powerUp,
hitHurt,
jump,
blipSelect,
pushSound,
random,
birdSound
];

var generatorNames = [
'pickupCoin',
'laserShoot',
'explosion',
'powerUp',
'hitHurt',
'jump',
'blipSelect',
'pushSound',
'random',
'birdSound'
];

/*
i like 9675111
*/
function generateFromSeed(seed) {
  rng = new RNG((seed / 100) | 0);
  var generatorindex = seed % 100;
  var soundGenerator = generators[generatorindex % generators.length];
  seeded = true;
  var result = soundGenerator();
  result.seed = seed;
  seeded = false;
  return result;
};

function SoundEffect(length, sample_rate) {
  this._buffer = AUDIO_CONTEXT.createBuffer(1, length, sample_rate);
}

SoundEffect.prototype.getBuffer = function() {
  return this._buffer.getChannelData(0);
};


//unlock bullshit
function ULBS(){   
  if (AUDIO_CONTEXT.state === 'suspended')
  {
      var unlock = function()
      {
        AUDIO_CONTEXT.resume().then(function()
          {
            document.body.removeEventListener('touchstart', unlock);
            document.body.removeEventListener('touchend', unlock);
            document.body.removeEventListener('mousedown', unlock);
            document.body.removeEventListener('mouseup', unlock);
            document.body.removeEventListener('keydown', unlock);
            document.body.removeEventListener('keyup', unlock);
          });
      };

      document.body.addEventListener('touchstart', unlock, false);
      document.body.addEventListener('touchend', unlock, false);
      document.body.addEventListener('mousedown', unlock, false);
      document.body.addEventListener('mouseup', unlock, false);
      document.body.addEventListener('keydown', unlock, false);
      document.body.addEventListener('keyup', unlock, false);
  }
}

SoundEffect.prototype.play = function() {
  ULBS();

  var source = AUDIO_CONTEXT.createBufferSource();
  var filter1 = AUDIO_CONTEXT.createBiquadFilter();
  var filter2 = AUDIO_CONTEXT.createBiquadFilter();
  var filter3 = AUDIO_CONTEXT.createBiquadFilter();

  source.buffer = this._buffer;
  source.connect(filter1);

  filter1.frequency.value = 1600;
  filter2.frequency.value = 1600;
  filter3.frequency.value = 1600;

  filter1.connect(filter2);
  filter2.connect(filter3);
  filter3.connect(AUDIO_CONTEXT.destination);
  var t = AUDIO_CONTEXT.currentTime;
  if (typeof source.start != 'undefined') {
    source.start(t);
  } else {
    source.noteOn(t);
  }
  source.onended = function() {
    filter3.disconnect()
  }
};

SoundEffect.MIN_SAMPLE_RATE = 22050;

if (typeof AUDIO_CONTEXT == 'undefined') {
  SoundEffect = function SoundEffect(length, sample_rate) {
    this._sample_rate = sample_rate;
    this._buffer = new Array(length);
    this._audioElement = null;
  };

  SoundEffect.prototype.getBuffer = function() {
    this._audioElement = null;
    return this._buffer;
  };

  SoundEffect.prototype.play = function() {
    if (this._audioElement) {
      this._audioElement.cloneNode(false).play();
    } else {
      for (var i = 0; i < this._buffer.length; i++) {
        // bit_depth is always 8, rescale [-1.0, 1.0) to [0, 256)
        this._buffer[i] = 255 & Math.floor(128 * Math.max(0, Math.min(this._buffer[i] + 1, 2)));
      }
      var wav = MakeRiff(this._sample_rate, BIT_DEPTH, this._buffer);
      this._audioElement = new Audio();
      this._audioElement.src = wav.dataURI;
      this._audioElement.play();
    }
  };

  SoundEffect.MIN_SAMPLE_RATE = 1;
}

SoundEffect.generate = function(ps) {
/*  window.console.log(ps.wave_type + "\t" + ps.seed);

  var psstring="";
  for (var n in ps) {
    if (ps.hasOwnProperty(n)) {
      psstring = psstring +"result." + n+" = " + ps[n] + ";\n";
    }
  }
window.console.log(ps);
window.console.log(psstring);*/
  function repeat() {
    rep_time = 0;

    fperiod = 100.0 / (ps.p_base_freq * ps.p_base_freq + 0.001);
    period = Math.floor(fperiod);
    fmaxperiod = 100.0 / (ps.p_freq_limit * ps.p_freq_limit + 0.001);

    fslide = 1.0 - Math.pow(ps.p_freq_ramp, 3.0) * 0.01;
    fdslide = -Math.pow(ps.p_freq_dramp, 3.0) * 0.000001;

    square_duty = 0.5 - ps.p_duty * 0.5;
    square_slide = -ps.p_duty_ramp * 0.00005;

    if (ps.p_arp_mod >= 0.0)
      arp_mod = 1.0 - Math.pow(ps.p_arp_mod, 2.0) * 0.9;
    else
      arp_mod = 1.0 + Math.pow(ps.p_arp_mod, 2.0) * 10.0;
    arp_time = 0;
    arp_limit = Math.floor(Math.pow(1.0 - ps.p_arp_speed, 2.0) * 20000 + 32);
    if (ps.p_arp_speed == 1.0)
      arp_limit = 0;
  };

  var rep_time;
  var fperiod, period, fmaxperiod;
  var fslide, fdslide;
  var square_duty, square_slide;
  var arp_mod, arp_time, arp_limit;
  repeat();  // First time through, this is a bit of a misnomer

  // Filter
  var fltp = 0.0;
  var fltdp = 0.0;
  var fltw = Math.pow(ps.p_lpf_freq, 3.0) * 0.1;
  var fltw_d = 1.0 + ps.p_lpf_ramp * 0.0001;
  var fltdmp = 5.0 / (1.0 + Math.pow(ps.p_lpf_resonance, 2.0) * 20.0) *
    (0.01 + fltw);
  if (fltdmp > 0.8) fltdmp = 0.8;
  var fltphp = 0.0;
  var flthp = Math.pow(ps.p_hpf_freq, 2.0) * 0.1;
  var flthp_d = 1.0 + ps.p_hpf_ramp * 0.0003;

  // Vibrato
  var vib_phase = 0.0;
  var vib_speed = Math.pow(ps.p_vib_speed, 2.0) * 0.01;
  var vib_amp = ps.p_vib_strength * 0.5;

  // Envelope
  var env_vol = 0.0;
  var env_stage = 0;
  var env_time = 0;
  var env_length = [
    Math.floor(ps.p_env_attack * ps.p_env_attack * 100000.0),
    Math.floor(ps.p_env_sustain * ps.p_env_sustain * 100000.0),
    Math.floor(ps.p_env_decay * ps.p_env_decay * 100000.0)
  ];
  var env_total_length = env_length[0] + env_length[1] + env_length[2];

  // Phaser
  var phase = 0;
  var fphase = Math.pow(ps.p_pha_offset, 2.0) * 1020.0;
  if (ps.p_pha_offset < 0.0) fphase = -fphase;
  var fdphase = Math.pow(ps.p_pha_ramp, 2.0) * 1.0;
  if (ps.p_pha_ramp < 0.0) fdphase = -fdphase;
  var iphase = Math.abs(Math.floor(fphase));
  var ipp = 0;
  var phaser_buffer = [];
  for (var i = 0; i < 1024; ++i)
    phaser_buffer[i] = 0.0;

  // Noise
  var noise_buffer = [];
  for (var i = 0; i < 32; ++i)
    noise_buffer[i] = Math.random() * 2.0 - 1.0;

  // Repeat
  var rep_limit = Math.floor(Math.pow(1.0 - ps.p_repeat_speed, 2.0) * 20000
                             + 32);
  if (ps.p_repeat_speed == 0.0)
    rep_limit = 0;

  //var gain = 2.0 * Math.log(1 + (Math.E - 1) * ps.sound_vol);
  var gain = 2.0 * ps.sound_vol;
  var gain = Math.exp(ps.sound_vol) - 1;

  var num_clipped = 0;

  // ...end of initialization. Generate samples.

  var sample_sum = 0;
  var num_summed = 0;
  var summands = Math.floor(44100 / ps.sample_rate);

  var buffer_i = 0;
  var buffer_length = Math.ceil(env_total_length / summands);
  var buffer_complete = false;

  var sound;
  if (ps.sample_rate < SoundEffect.MIN_SAMPLE_RATE) {
    // Assume 4x gets close enough to MIN_SAMPLE_RATE
    sound = new SoundEffect(4 * buffer_length, SoundEffect.MIN_SAMPLE_RATE);
  } else {
    sound = new SoundEffect(buffer_length, ps.sample_rate)
  }
  var buffer = sound.getBuffer();

  for (var t = 0;; ++t) {

    // Repeats
    if (rep_limit != 0 && ++rep_time >= rep_limit)
      repeat();

    // Arpeggio (single)
    if (arp_limit != 0 && t >= arp_limit) {
      arp_limit = 0;
      fperiod *= arp_mod;
    }

    // Frequency slide, and frequency slide slide!
    fslide += fdslide;
    fperiod *= fslide;
    if (fperiod > fmaxperiod) {
      fperiod = fmaxperiod;
      if (ps.p_freq_limit > 0.0)
        buffer_complete = true;
    }

    // Vibrato
    var rfperiod = fperiod;
    if (vib_amp > 0.0) {
      vib_phase += vib_speed;
      rfperiod = fperiod * (1.0 + Math.sin(vib_phase) * vib_amp);
    }
    period = Math.floor(rfperiod);
    if (period < 8) period = 8;

    square_duty += square_slide;
    if (square_duty < 0.0) square_duty = 0.0;
    if (square_duty > 0.5) square_duty = 0.5;

    // Volume envelope
    env_time++;
    if (env_time > env_length[env_stage]) {
      env_time = 1;
      env_stage++;
      while (env_stage < 3 && env_length[env_stage] === 0)
	env_stage++;
      if (env_stage === 3)
        break;
    }
    if (env_stage === 0)
      env_vol = env_time / env_length[0];
    else if (env_stage === 1)
      env_vol = 1.0 + Math.pow(1.0 - env_time / env_length[1],
                               1.0) * 2.0 * ps.p_env_punch;
    else  // env_stage == 2
      env_vol = 1.0 - env_time / env_length[2];

    // Phaser step
    fphase += fdphase;
    iphase = Math.abs(Math.floor(fphase));
    if (iphase > 1023) iphase = 1023;

    if (flthp_d != 0.0) {
      flthp *= flthp_d;
      if (flthp < 0.00001)
        flthp = 0.00001;
      if (flthp > 0.1)
        flthp = 0.1;
    }

    // 8x supersampling
    var sample = 0.0;
    for (var si = 0; si < 8; ++si) {
      var sub_sample = 0.0;
      phase++;
      if (phase >= period) {
        phase %= period;
        if (ps.wave_type === NOISE)
          for (var i = 0; i < 32; ++i)
            noise_buffer[i] = Math.random() * 2.0 - 1.0;
      }

      // Base waveform
      var fp = phase / period;
      if (ps.wave_type === SQUARE) {
        if (fp < square_duty)
          sub_sample = 0.5;
        else
          sub_sample = -0.5;
      } else if (ps.wave_type === SAWTOOTH) {
        sub_sample = 1.0 - fp * 2;
      } else if (ps.wave_type === SINE) {
        sub_sample = Math.sin(fp * 2 * Math.PI);
      } else if (ps.wave_type === NOISE) {
        sub_sample = noise_buffer[Math.floor(phase * 32 / period)];
      } else if (ps.wave_type === TRIANGLE) {
        sub_sample = Math.abs(1 - fp * 2) - 1;
      } else if (ps.wave_type === BREAKER) {
        sub_sample = Math.abs(1 - fp * fp * 2) - 1;
      } else {
        throw new Exception('bad wave type! ' + ps.wave_type);
      }

      // Low-pass filter
      var pp = fltp;
      fltw *= fltw_d;
      if (fltw < 0.0) fltw = 0.0;
      if (fltw > 0.1) fltw = 0.1;
      if (ps.p_lpf_freq != 1.0) {
        fltdp += (sub_sample - fltp) * fltw;
        fltdp -= fltdp * fltdmp;
      } else {
        fltp = sub_sample;
        fltdp = 0.0;
      }
      fltp += fltdp;

      // High-pass filter
      fltphp += fltp - pp;
      fltphp -= fltphp * flthp;
      sub_sample = fltphp;

      // Phaser
      phaser_buffer[ipp & 1023] = sub_sample;
      sub_sample += phaser_buffer[(ipp - iphase + 1024) & 1023];
      ipp = (ipp + 1) & 1023;

      // final accumulation and envelope application
      sample += sub_sample * env_vol;
    }

    // Accumulate samples appropriately for sample rate
    sample_sum += sample;
    if (++num_summed >= summands) {
      num_summed = 0;
      sample = sample_sum / summands;
      sample_sum = 0;
    } else {
      continue;
    }

    sample = sample / 8 * masterVolume;
    sample *= gain;

    buffer[buffer_i++] = sample;

    if (ps.sample_rate < SoundEffect.MIN_SAMPLE_RATE) {
      buffer[buffer_i++] = sample;
      buffer[buffer_i++] = sample;
      buffer[buffer_i++] = sample;
    }
  }

  if (summands > 0) {
    sample = sample_sum / summands;

    sample = sample / 8 * masterVolume;
    sample *= gain;

    buffer[buffer_i++] = sample;

    if (ps.sample_rate < SoundEffect.MIN_SAMPLE_RATE) {
      buffer[buffer_i++] = sample;
      buffer[buffer_i++] = sample;
      buffer[buffer_i++] = sample;
    }
  }

  return sound;
};

// if (typeof exports != 'undefined') {
//   // For node.js
//   var RIFFWAVE = require('./riffwave').RIFFWAVE;
//   exports.Params = Params;
//   exports.generate = generate;
// }

var sfxCache = {};
var cachedSeeds = [];
var CACHE_MAX = 50;

function cacheSeed(seed){
  if (seed in sfxCache) {
    return sfxCache[seed];
  }

  var params = generateFromSeed(seed);
  params.sound_vol = SOUND_VOL;
  params.sample_rate = SAMPLE_RATE;
  params.bit_depth = BIT_DEPTH;

  var sound = SoundEffect.generate(params);
  sfxCache[seed] = sound;
  cachedSeeds.push(seed);

  while (cachedSeeds.length>CACHE_MAX) {
    var toRemove=cachedSeeds[0];
    cachedSeeds = cachedSeeds.slice(1);
    delete sfxCache[toRemove];
  }

  return sound;
}


function playSound(seed) {
  if (muted){
    return;
  }
  checkAudioContextExists();
  if (unitTesting) return;
  var sound = cacheSeed(seed);
  sound.play();
}



function killAudioButton(){
  var mb = document.getElementById("muteButton");
  var umb = document.getElementById("unMuteButton");
  if (mb){
    mb.remove();
    umb.remove();
  }
}

function showAudioButton(){
  var mb = document.getElementById("muteButton");
  var umb = document.getElementById("unMuteButton");
  if (mb){
    mb.style.display="block"; 
    umb.style.display="none";
  }
}


function toggleMute() {
  if (muted===0){
    muteAudio();
  } else {
    unMuteAudio();
  }
}

function muteAudio() {
  muted=1; 
  tryDeactivateYoutube();
  var mb = document.getElementById("muteButton");
  var umb = document.getElementById("unMuteButton");
  if (mb){
    mb.style.display="none"; 
    umb.style.display="block";
  }
}
function unMuteAudio() {
  muted=0; 
  tryActivateYoutube();
  var mb = document.getElementById("muteButton");
  var umb = document.getElementById("unMuteButton");
  if (mb){
    mb.style.display="block"; 
    umb.style.display="none";
  }
}
// @@end js/sfxr.js


// @@begin js/colors.js
const colorPalettesAliases = {
	1 : "mastersystem",
	2 : "gameboycolour",
	3 : "amiga",
	4 : "arnecolors",
	5 : "famicom",
	6 : "atari",
	7 : "pastel",
	8 : "ega",
	9 : "amstrad",
	10 : "proteus_mellow",
	11 : "proteus_rich",
	12 : "proteus_night",
	13 : "c64",
	14 : "whitingjp"
};

const colorPalettes = {
	mastersystem : {
	black   		: "#000000",
	white			: "#FFFFFF",
	grey			: "#555555",
	darkgrey		: "#555500",
	lightgrey		: "#AAAAAA",
	gray			: "#555555",
	darkgray		: "#555500",
	lightgray		: "#AAAAAA",
	red				: "#FF0000",
	darkred			: "#AA0000",
	lightred		: "#FF5555",
	brown			: "#AA5500",
	darkbrown		: "#550000",
	lightbrown		: "#FFAA00",
	orange			: "#FF5500",
	yellow 			: "#FFFF55",
	green			: "#55AA00",
	darkgreen		: "#005500",
	lightgreen		: "#AAFF00",
	blue			: "#5555AA",
	lightblue		: "#AAFFFF",
	darkblue		: "#000055",
	purple			: "#550055",
	pink			: "#FFAAFF"
	},

	gameboycolour : {
	black   		: "#000000",
	white			: "#FFFFFF",
	grey			: "#7F7F7C",
	darkgrey		: "#3E3E44",
	lightgrey		: "#BAA7A7",
	gray			: "#7F7F7C",
	darkgray		: "#3E3E44",
	lightgray		: "#BAA7A7",
	red				: "#A7120C",
	darkred			: "#880606",
	lightred		: "#BA381F",
	brown			: "#57381F",
	darkbrown		: "#3E2519",
	lightbrown		: "#8E634B",
	orange			: "#BA4B32",
	yellow 			: "#C0BA6F",
	green			: "#517525",
	darkgreen		: "#385D12",
	lightgreen		: "#6F8E44",
	blue			: "#5D6FA7",
	lightblue		: "#8EA7A7",
	darkblue		: "#4B575D",
	purple			: "#3E3E44",
	pink			: "#BA381F"
	},

	amiga : {
	black   		: "#000000",
	white			: "#FFFFFF",
	grey			: "#BBBBBB",
	darkgrey		: "#333333",
	lightgrey		: "#FFEEDD",
	gray			: "#BBBBBB",
	darkgray		: "#333333",
	lightgray		: "#FFEEDD",
	red				: "#DD1111",
	darkred			: "#990000",
	lightred		: "#FF4422",
	brown			: "#663311",
	darkbrown		: "#331100",
	lightbrown		: "#AA6644",
	orange			: "#FF6644",
	yellow 			: "#FFDD66",
	green			: "#448811",
	darkgreen		: "#335500",
	lightgreen		: "#88BB77",
	blue			: "#8899DD",
	lightblue		: "#BBDDEE",
	darkblue		: "#666688",
	purple			: "#665555",
	pink			: "#997788"
	},

	arnecolors : {
	black   		: "#000000",
	white			: "#FFFFFF",
	grey			: "#9d9d9d",
	darkgrey		: "#697175",
	lightgrey		: "#cccccc",
	gray			: "#9d9d9d",
	darkgray		: "#697175",
	lightgray		: "#cccccc",
	red				: "#be2633",
	darkred			: "#732930",
	lightred		: "#e06f8b",
	brown			: "#a46422",
	darkbrown		: "#493c2b",
	lightbrown		: "#eeb62f",
	orange			: "#eb8931",
	yellow 			: "#f7e26b",
	green			: "#44891a",
	darkgreen		: "#2f484e",
	lightgreen		: "#a3ce27",
	blue			: "#1d57f7",
	lightblue		: "#B2DCEF",
	darkblue		: "#1B2632",
	purple			: "#342a97",
	pink			: "#de65e2"
	},
	famicom : {
	black   		: "#000000",
	white			: "#ffffff",
	grey			: "#7c7c7c",
	darkgrey		: "#080808",
	lightgrey		: "#bcbcbc",
	gray			: "#7c7c7c",
	darkgray		: "#080808",
	lightgray		: "#bcbcbc",
	red				: "#f83800",
	darkred			: "#881400",
	lightred		: "#f87858",
	brown			: "#AC7C00",
	darkbrown		: "#503000",
	lightbrown		: "#FCE0A8",
	orange			: "#FCA044",
	yellow 			: "#F8B800",
	green			: "#00B800",
	darkgreen		: "#005800",
	lightgreen		: "#B8F8B8",
	blue			: "#0058F8",
	lightblue		: "#3CBCFC",
	darkblue		: "#0000BC",
	purple			: "#6644FC",
	pink			: "#F878F8"
	},

	atari : {
	black   		: "#000000",
	white			: "#FFFFFF",
	grey			: "#909090",
	darkgrey		: "#404040",
	lightgrey		: "#b0b0b0",
	gray			: "#909090",
	darkgray		: "#404040",
	lightgray		: "#b0b0b0",
	red				: "#A03C50",
	darkred			: "#700014",
	lightred		: "#DC849C",
	brown			: "#805020",
	darkbrown		: "#703400",
	lightbrown		: "#CB9870",
	orange			: "#CCAC70",
	yellow 			: "#ECD09C",
	green			: "#58B06C",
	darkgreen		: "#006414",
	lightgreen		: "#70C484",
	blue			: "#1C3C88",
	lightblue		: "#6888C8",
	darkblue		: "#000088",
	purple			: "#3C0080",
	pink			: "#B484DC"
	},
	pastel : {
	black   		: "#000000",
	white			: "#FFFFFF",
	grey			: "#3e3e3e",
	darkgrey		: "#313131",
	lightgrey		: "#9cbcbc",
	gray			: "#3e3e3e",
	darkgray		: "#313131",
	lightgray		: "#9cbcbc",
	red				: "#f56ca2",
	darkred			: "#a63577",
	lightred		: "#ffa9cf",
	brown			: "#b58c53",
	darkbrown		: "#787562",
	lightbrown		: "#B58C53",
	orange			: "#EB792D",
	yellow 			: "#FFe15F",
	green			: "#00FF4F",
	darkgreen		: "#2b732c",
	lightgreen		: "#97c04f",
	blue			: "#0f88d3",
	lightblue		: "#00fffe",
	darkblue		: "#293a7b",
	purple			: "#ff6554",
	pink			: "#eb792d"
	},
	ega : {
	black   		: "#000000",
	white			: "#ffffff",
	grey			: "#555555",
	darkgrey		: "#555555",
	lightgrey		: "#aaaaaa",
	gray			: "#555555",
	darkgray		: "#555555",
	lightgray		: "#aaaaaa",
	red				: "#ff5555",
	darkred			: "#aa0000",
	lightred		: "#ff55ff",
	brown			: "#aa5500",
	darkbrown		: "#aa5500",
	lightbrown		: "#ffff55",
	orange			: "#ff5555",
	yellow 			: "#ffff55",
	green			: "#00aa00",
	darkgreen		: "#00aaaa",
	lightgreen		: "#55ff55",
	blue			: "#5555ff",
	lightblue		: "#55ffff",
	darkblue		: "#0000aa",
	purple			: "#aa00aa",
	pink			: "#ff55ff"
	},


	proteus_mellow : {
	black   		: "#3d2d2e",
	white			: "#ddf1fc",
	grey			: "#9fb2d4",
	darkgrey		: "#7b8272",
	lightgrey		: "#a4bfda",
	gray			: "#9fb2d4",
	darkgray		: "#7b8272",
	lightgray		: "#a4bfda",
	red				: "#9d5443",
	darkred			: "#8c5b4a",
	lightred		: "#94614c",
	brown			: "#89a78d",
	darkbrown		: "#829e88",
	lightbrown		: "#aaae97",
	orange			: "#d1ba86",
	yellow 			: "#d6cda2",
	green			: "#75ac8d",
	darkgreen		: "#8fa67f",
	lightgreen		: "#8eb682",
	blue			: "#88a3ce",
	lightblue		: "#a5adb0",
	darkblue		: "#5c6b8c",
	purple			: "#d39fac",
	pink			: "#c8ac9e"
	},
	

	proteus_night : {
	black   		: "#010912",
	white			: "#fdeeec",
	grey			: "#051d40",
	darkgrey		: "#091842",
	lightgrey		: "#062151",
	gray			: "#051d40",
	darkgray		: "#091842",
	lightgray		: "#062151",
	red				: "#ad4576",
	darkred			: "#934765",
	lightred		: "#ab6290",
	brown			: "#61646b",
	darkbrown		: "#3d2d2d",
	lightbrown		: "#8393a0",
	orange			: "#0a2227",
	yellow 			: "#0a2541",
	green			: "#75ac8d",
	darkgreen		: "#0a2434",
	lightgreen		: "#061f2e",
	blue			: "#0b2c79",
	lightblue		: "#809ccb",
	darkblue		: "#08153b",
	purple			: "#666a87",
	pink			: "#754b4d"
	},
	


	proteus_rich: {
	black   		: "#6f686f",
	white			: "#d1b1e2",
	grey			: "#b9aac1",
	darkgrey		: "#8e8b84",
	lightgrey		: "#c7b5cd",
	gray			: "#b9aac1",
	darkgray		: "#8e8b84",
	lightgray		: "#c7b5cd",
	red				: "#a11f4f",
	darkred			: "#934765",
	lightred		: "#c998ad",
	brown			: "#89867d",
	darkbrown		: "#797f75",
	lightbrown		: "#ab9997",
	orange			: "#ce8c5c",
	yellow 			: "#f0d959",
	green			: "#75bc54",
	darkgreen		: "#599d79",
	lightgreen		: "#90cf5c",
	blue			: "#8fd0ec",
	lightblue		: "#bcdce7",
	darkblue		: "#0b2c70",
	purple			: "#9b377f",
	pink			: "#cd88e5"
	},
	

	
amstrad : {
	black   		: "#000000",
	white			: "#ffffff",
	grey			: "#7f7f7f",
	darkgrey		: "#636363",
	lightgrey		: "#afafaf",
	gray			: "#7f7f7f",
	darkgray		: "#636363",
	lightgray		: "#afafaf",
	red				: "#ff0000",
	darkred			: "#7f0000",
	lightred		: "#ff7f7f",
	brown			: "#ff7f00",
	darkbrown		: "#7f7f00",
	lightbrown		: "#ffff00",
	orange			: "#ff007f",
	yellow 			: "#ffff7f",
	green			: "#01ff00",
	darkgreen		: "#007f00",
	lightgreen		: "#7fff7f",
	blue			: "#0000ff",
	lightblue		: "#7f7fff",
	darkblue		: "#00007f",
	purple			: "#7f007f",
	pink			: "#ff7fff"
	},
c64 : {
	black   		: "#000000",
	white			: "#ffffff",
	grey			: "#6C6C6C",
	darkgrey		: "#444444",
	lightgrey		: "#959595",
	gray			: "#6C6C6C",
	darkgray		: "#444444",
	lightgray		: "#959595",
	red				: "#68372B",
	darkred			: "#3f1e17",
	lightred		: "#9A6759",
	brown			: "#433900",
	darkbrown		: "#221c02",
	lightbrown		: "#6d5c0d",
	orange			: "#6F4F25",
	yellow 			: "#B8C76F",
	green			: "#588D43",
	darkgreen		: "#345129",
	lightgreen		: "#9AD284",
	blue			: "#6C5EB5",
	lightblue		: "#70A4B2",
	darkblue		: "#352879",
	purple			: "#6F3D86",
	pink			: "#b044ac"
},
whitingjp : {
  black       : "#202527",
  white       : "#eff8fd",
  grey        : "#7b7680",
  darkgrey    : "#3c3b44",
  lightgrey   : "#bed0d7",
  gray        : "#7b7680",
  darkgray    : "#3c3b44",
  lightgray   : "#bed0d7",
  red         : "#bd194b",
  darkred     : "#6b1334",
  lightred    : "#ef2358",
  brown       : "#b52e1c",
  darkbrown   : "#681c12",
  lightbrown  : "#e87b45",
  orange      : "#ff8c10",
  yellow      : "#fbd524",
  green       : "#36bc3c",
  darkgreen   : "#317610",
  lightgreen  : "#8ce062",
  blue        : "#3f62c6",
  lightblue   : "#57bbe0",
  darkblue    : "#2c2fa0",
  purple      : "#7037d9",
  pink        : "#ec2b8f"
}
};

var reg_color_names = /(black|white|darkgray|lightgray|gray|grey|darkgrey|lightgrey|red|darkred|lightred|brown|darkbrown|lightbrown|orange|yellow|green|darkgreen|lightgreen|blue|lightblue|darkblue|purple|pink|transparent)\s*/;

var reg_color = /(black|white|gray|darkgray|lightgray|grey|darkgrey|lightgrey|red|darkred|lightred|brown|darkbrown|lightbrown|orange|yellow|green|darkgreen|lightgreen|blue|lightblue|darkblue|purple|pink|transparent|#(?:[0-9a-f]{2}){3,4}|#(?:[0-9a-f]{3}))\s*/;






// @@end js/colors.js


// @@begin js/graphics.js
function createSprite(name,spritegrid, colors, padding) {
	if (colors === undefined) {
		colors = [state.bgcolor, state.fgcolor];
	}

	var sprite = makeSpriteCanvas(name);
	var spritectx = sprite.getContext('2d');

    renderSprite(spritectx, spritegrid, colors, padding, 0, 0);

    return sprite;
}

function renderSprite(spritectx, spritegrid, colors, padding, x, y) {
    if (colors === undefined) {
        colors = ['#00000000', state.fgcolor];
    }

    var offsetX = x * cellwidth;
    var offsetY = y * cellheight;

    spritectx.clearRect(offsetX, offsetY, cellwidth, cellheight);

	var w = spritegrid[0].length;
	var h = spritegrid.length;
	var cw = ~~(cellwidth / (w + (padding|0)));
    var ch = ~~(cellheight / (h + (padding|0)));
    var pixh=ch;
    if ("scanline" in state.metadata) {
        pixh=Math.ceil(ch/2);
    }
    spritectx.fillStyle = state.fgcolor;
    for (var j = 0; j < h; j++) {
        for (var k = 0; k < w; k++) {
            var val = spritegrid[j][k];
            if (val >= 0) {
                var cy = (j * ch)|0;
                var cx = (k * cw)|0;
                spritectx.fillStyle = colors[val];
                spritectx.fillRect(offsetX + cx, offsetY + cy, cw, pixh);
            }
        }
    }
}

function drawTextWithCustomFont(txt, ctx, x, y) {
    ctx.fillStyle = state.fgcolor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    var fontSize = 1;
    if (state.metadata.font_size !== undefined) {
        fontSize = Math.max(parseFloat(state.metadata.font_size), 0)
    }
    ctx.font = (cellheight * fontSize) + "px PuzzleCustomFont";
    ctx.fillText(txt, x, y);
}

var textsheetCanvas = null;

function regenText(spritecanvas,spritectx) {
    if (textsheetCanvas == null) {
        textsheetCanvas = document.createElement('canvas');
    }

    var textsheetSize = Math.ceil(Math.sqrt(fontKeys.length));

    textsheetCanvas.width = textsheetSize * cellwidth;
    textsheetCanvas.height = textsheetSize * cellheight * 2;

    var textsheetContext = textsheetCanvas.getContext('2d');

    for (var n = 0; n < fontKeys.length; n++) {
        var key = fontKeys[n];
        if (font.hasOwnProperty(key)) {
            let fontstr = font[key].split('\n').map(a=>a.trim().split('').map(t=>parseInt(t)));
            fontstr.shift();

            var textX = (n % textsheetSize)|0;
            var textY = (n / textsheetSize)|0;

            renderSprite(textsheetContext, fontstr, undefined, 1, textX, textY);
            renderSprite(textsheetContext, fontstr, ['#00000000', '#000000'], 1, textX, textY + textsheetSize);
        }
    }
}

var editor_s_grille=[[0,1,1,1,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[0,1,1,1,0]];

var spriteimages;
var spritesheetCanvas = null;
function regenSpriteImages() {
	if (textMode) {
        spriteimages = [];
		regenText();
		return;
	} 
    
    if (IDE===true) {
        textImages['editor_s'] = createSprite('chars',editor_s_grille,undefined);
    }
    
    if (state.levels.length===0) {
        return;
    }
    spriteimages = [];
    
    var spritesheetSize = Math.ceil(Math.sqrt(sprites.length));

    if (spritesheetCanvas == null) {
        spritesheetCanvas = document.createElement('canvas');
    }

    spritesheetCanvas.width = spritesheetSize * cellwidth;
    spritesheetCanvas.height = spritesheetSize * cellheight;

    var spritesheetContext = spritesheetCanvas.getContext('2d')

    for (var i = 0; i < sprites.length; i++) {
        if (sprites[i] == undefined) {
            continue;
        }

        if (canOpenEditor) {
            spriteimages[i] = createSprite(i.toString(),sprites[i].dat, sprites[i].colors);
        }
        
        var spriteX = (i % spritesheetSize)|0;
        var spriteY = (i / spritesheetSize)|0;
        renderSprite(spritesheetContext, sprites[i].dat, sprites[i].colors, 0, spriteX, spriteY);
    }

    if (canOpenEditor) {
    	generateGlyphImages();
    }
}

var glyphImagesCorrespondance;
var glyphImages;
var glyphHighlight;
var glyphHighlightDiff;
var glyphHighlightResize;
var glyphPrintButton;
var glyphMouseOver;
var glyphSelectedIndex=0;
var editorRowCount=1;
var editorGlyphMovements=[];

var canvasdict={};
function makeSpriteCanvas(name) {
    var canvas;
    if (name in canvasdict) {
        canvas = canvasdict[name];
    } else {
        canvas = document.createElement('canvas');
        canvasdict[name]=canvas;
    }
	canvas.width = cellwidth;
	canvas.height = cellheight;
	return canvas;
}


function generateGlyphImages() {
    if (cellwidth===0||cellheight===0) {
        return;
    }
	glyphImagesCorrespondance=[];
	glyphImages=[];
	
    seenobjects = {};
	for (var n in state.glyphDict) {
		if (n.length==1 && state.glyphDict.hasOwnProperty(n)) {            
			var g=state.glyphDict[n];

            /* hide duplicate entries from editor palette*/
            var trace = g.join(",");
            if (seenobjects.hasOwnProperty(trace)){
                continue;
            }
            
			var sprite = makeSpriteCanvas("C"+n)
			var spritectx = sprite.getContext('2d');
			glyphImagesCorrespondance.push(n);
            seenobjects[trace]=true;

			for (var i=0;i<g.length;i++){
				var id = g[i];
				if (id===-1) {
					continue;
                }
				spritectx.drawImage(spriteimages[id], 0, 0);
			}
			glyphImages.push(sprite);
		}
	}

	if (IDE) {
		//make highlight thingy
		glyphHighlight = makeSpriteCanvas("highlight");
		var spritectx = glyphHighlight.getContext('2d');
		spritectx.fillStyle = '#FFFFFF';

		spritectx.fillRect(0,0,cellwidth,1);
		spritectx.fillRect(0,0,1,cellheight);
		
		spritectx.fillRect(0,cellheight-1,cellwidth,1);
		spritectx.fillRect(cellwidth-1,0,1,cellheight);

		glyphPrintButton = textImages['editor_s'];

		//make diff highlighter thingy
		glyphHighlightDiff = makeSpriteCanvas("glyphHighlightDiff");
		var spritectx = glyphHighlightDiff.getContext('2d');
        
		spritectx.fillStyle =  state.bgcolor;

		spritectx.fillRect(0,0,cellwidth,2);
		spritectx.fillRect(0,0,2,cellheight);
		
		spritectx.fillRect(0,cellheight-2,cellwidth,2);
		spritectx.fillRect(cellwidth-2,0,2,cellheight);

		spritectx.fillStyle = state.fgcolor;

		spritectx.fillRect(0,0,cellwidth,1);
		spritectx.fillRect(0,0,1,cellheight);
		
		spritectx.fillRect(0,cellheight-1,cellwidth,1);
		spritectx.fillRect(cellwidth-1,0,1,cellheight);

        

		glyphPrintButton = textImages['editor_s'];


		//make highlight thingy
		glyphHighlightResize = makeSpriteCanvas("highlightresize");
		var spritectx = glyphHighlightResize.getContext('2d');
		spritectx.fillStyle = '#FFFFFF';
		
		var minx=((cellwidth/2)-1)|0;
		var xsize=cellwidth-minx-1-minx;
		var miny=((cellheight/2)-1)|0;
		var ysize=cellheight-miny-1-minx;

		spritectx.fillRect(minx,0,xsize,cellheight);
		spritectx.fillRect(0,miny,cellwidth,ysize);

		//make highlight thingy
		glyphMouseOver = makeSpriteCanvas("glyphMouseOver");
		var spritectx = glyphMouseOver.getContext('2d');
		spritectx.fillStyle = 'yellow';
		
		spritectx.fillRect(0,0,cellwidth,2);
		spritectx.fillRect(0,0,2,cellheight);
		
		spritectx.fillRect(0,cellheight-2,cellwidth,2);
		spritectx.fillRect(cellwidth-2,0,2,cellheight);

        //make movement glyphs

        /* 
        up:1
        down:2
        left:4
        right:8
        action:16

        */
        const coords = [
            //up
            [ [3,2],[5,0],[7,2]],
            //down
            [ [3,8],[5,10],[7,8]],
            //left
            [ [2,3],[0,5],[2,7]],
            //right
            [ [7,3],[10,5],[7,7]],
            //action
            [ [3,5],[5,7],[7,5],[5,3]],
        ];

        for (var i=0;i<coords.length;i++){
            editorGlyphMovements[i]=makeSpriteCanvas("editorGlyphMovements"+i);
            var path = coords[i];

            var spritectx = editorGlyphMovements[i].getContext('2d');
            spritectx.lineWidth=1;
            
            
		    spritectx.fillStyle =  state.bgcolor;
		    spritectx.strokeStyle = state.fgcolor;


            spritectx.beginPath();       // Start a new path
            spritectx.moveTo(path[0][0]*cellwidth/10.0, path[0][1]*cellheight/10.0);    
            for (var j=1;j<path.length;j++){
                spritectx.lineTo(path[j][0]*cellwidth/10.0, path[j][1]*cellheight/10.0);   
            }
            spritectx.closePath();
            spritectx.fill();
            spritectx.stroke();          // Render the path

                

        }
	}
}

var canvas;
var ctx;


var x;
var y;
var cellwidth;
var cellheight;
var xoffset;
var yoffset;

window.addEventListener('resize', canvasResize, false);
canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');
x = 0;
y = 0;

function glyphCount(){
    var count=0;
    for (var n in state.glyphDict) {
        if (n.length==1 && state.glyphDict.hasOwnProperty(n)) {
            count++;
        }
    }    
    return count;
}

function redraw() {
    if (cellwidth===0||cellheight===0) {
        return;
    }

    var textsheetSize = Math.ceil(Math.sqrt(fontKeys.length));

    if (textMode) {
        ctx.fillStyle = state.bgcolor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(state.metadata.custom_font === undefined || !loadedCustomFont) { 
            for (var i = 0; i < titleWidth; i++) {
                for (var j = 0; j < titleHeight; j++) {
                    var ch = titleImage[j].charAt(i);
                    if (ch in font) {
                        var index = fontIndex[ch];
                        var textX = (index % textsheetSize)|0;
                        var textY = (index / textsheetSize)|0;
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(
                            textsheetCanvas,
                            textX * textcellwidth,
                            textY * textcellheight,
                            textcellwidth, textcellheight,
                            xoffset + i * cellwidth,
                            yoffset + j * cellheight,
                            cellwidth, cellheight
                        );
                        ctx.imageSmoothingEnabled = true;
                    }
                }
            }
        } else {
            if (spritesheetCanvas===null) {
                regenSpriteImages();
            }
            
            for(var i = 0; i < titleHeight; i++) {
                var row = titleImage[i];
                drawTextWithCustomFont(row, ctx, xoffset + titleWidth * cellwidth / 2, yoffset + i * cellheight + cellheight/2);           
            }
        }
        return;
    } else {
        var curlevel = level;
        if (diffToVisualize!==null){
            curlevel = new Level(-1,diffToVisualize.width,diffToVisualize.height,diffToVisualize.layerCount,diffToVisualize.objects);
            curlevel.movements = diffToVisualize.movements;
        }
        ctx.fillStyle = state.bgcolor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var mini=0;
        var maxi=screenwidth;
        var minj=0;
        var maxj=screenheight;

        var cameraOffset = {
            x: 0,
            y: 0
        };

        if (levelEditorOpened) {
            var glyphcount = glyphCount();
            editorRowCount = Math.ceil(glyphcount/(screenwidth-1));
            maxi-=2;
            maxj-=2+editorRowCount;
        } else if (flickscreen) {
            var playerPositions = getPlayerPositions();
            if (playerPositions.length>0) {
                var playerPosition=playerPositions[0];
                var px = (playerPosition/(curlevel.height))|0;
                var py = (playerPosition%curlevel.height)|0;

                var screenx = (px/screenwidth)|0;
                var screeny = (py/screenheight)|0;
                mini=screenx*screenwidth;
                minj=screeny*screenheight;
                maxi=Math.min(mini+screenwidth,curlevel.width);
                maxj=Math.min(minj+screenheight,curlevel.height);

                oldflickscreendat=[mini,minj,maxi,maxj];
            } else if (oldflickscreendat.length>0){
                mini=oldflickscreendat[0];
                minj=oldflickscreendat[1];
                maxi=oldflickscreendat[2];
                maxj=oldflickscreendat[3];
            }
        } else if (zoomscreen) {
            var playerPositions = getPlayerPositions();
            if (playerPositions.length>0) {
                var playerPosition=playerPositions[0];
                var px = (playerPosition/(curlevel.height))|0;
                var py = (playerPosition%curlevel.height)|0;
                mini=Math.max(Math.min(px-((screenwidth/2)|0),curlevel.width-screenwidth),0);
                minj=Math.max(Math.min(py-((screenheight/2)|0),curlevel.height-screenheight),0);
                maxi=Math.min(mini+screenwidth,curlevel.width);
                maxj=Math.min(minj+screenheight,curlevel.height);
                oldflickscreendat=[mini,minj,maxi,maxj];
            }  else if (oldflickscreendat.length>0){
                mini=oldflickscreendat[0];
                minj=oldflickscreendat[1];
                maxi=oldflickscreendat[2];
                maxj=oldflickscreendat[3];
            }         
        } else if (smoothscreen) {
            if (cameraPositionTarget !== null) {
                ['x', 'y'].forEach(function (coord) {
                    var cameraTargetVector = cameraPositionTarget[coord] - cameraPosition[coord];

                    if (cameraTargetVector === 0) {
                        return;
                    } else if (Math.abs(cameraTargetVector) < (0.5 / cellwidth)) {
                        // Canvas doesn't actually render subpixels, but when the camera is less than half a subpixel away from target, snap to target
                        cameraPosition[coord] = cameraPositionTarget[coord]
                        return
                    }

                    cameraPosition[coord] += cameraTargetVector * state.metadata.smoothscreen.cameraSpeed;
                    //console.log(coord + " "+ cameraPosition[coord])
                    cameraOffset[coord] = cameraPosition[coord] % 1;
                })

                mini=Math.max(Math.min(Math.floor(cameraPosition.x)-Math.floor(screenwidth/2), level.width-screenwidth),0);
                minj=Math.max(Math.min(Math.floor(cameraPosition.y)-Math.floor(screenheight/2), level.height-screenheight),0);

                maxi=Math.min(mini+screenwidth,level.width);
                maxj=Math.min(minj+screenheight,level.height);
                oldflickscreendat=[mini,minj,maxi,maxj];
            } else if (oldflickscreendat.length>0) {
                mini=oldflickscreendat[0];
                minj=oldflickscreendat[1];
                maxi=oldflickscreendat[2];
                maxj=oldflickscreendat[3];
            }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(xoffset, yoffset);
            ctx.lineTo(xoffset + (maxi - mini) * cellwidth, yoffset);
            ctx.lineTo(xoffset + (maxi - mini) * cellwidth, yoffset + (maxj - minj) * cellwidth);
            ctx.lineTo(xoffset, yoffset + (maxj - minj) * cellwidth);
            ctx.clip();
        }
	    
		screenOffsetX = mini;
		screenOffsetY = minj;

        var renderBorderSize = smoothscreen ? 1 : 0;
        var spritesheetSize = Math.ceil(Math.sqrt(sprites.length));
        var tweening = state.metadata.tween_length && currentMovedEntities;

        if (!tweening) { //Seperated tweening/non-tweening draw loops for performance considerations
            for (var i = Math.max(mini - renderBorderSize, 0); i < Math.min(maxi + renderBorderSize, curlevel.width); i++) {
                for (var j = Math.max(minj - renderBorderSize, 0); j < Math.min(maxj + renderBorderSize, curlevel.height); j++) {
                    var posIndex = j + i * curlevel.height;
                    var posMask = curlevel.getCellInto(posIndex,_o12);    
                    for (var k = 0; k < state.objectCount; k++) {            
                
                        if (posMask.get(k) != 0) {                  
                            var spriteX = (k % spritesheetSize)|0;
                            var spriteY = (k / spritesheetSize)|0;

                            var x = xoffset + (i-mini-cameraOffset.x) * cellwidth;
                            var y = yoffset + (j-minj-cameraOffset.y) * cellheight;
                                
                            ctx.drawImage(
                                spritesheetCanvas, 
                                spriteX * cellwidth, spriteY * cellheight, cellwidth, cellheight,
                                Math.floor(x), Math.floor(y), cellwidth, cellheight);
                        }
                    }
                }
            }
        } else { //Loop when tweening
            var tween = 1-clamp(tweentimer/tweeninterval, 0, 1);

            //Defaults
            var tween_name = "linear";
            var tween_snap = state.sprite_size;

            //Lookup
            if (state.metadata.tween_easing!==undefined){
                tween_name = state.metadata.tween_easing;
                if (parseInt(tween_name) != NaN && easingAliases[parseInt(tween_name)]) {
                    tween_name = easingAliases[parseInt(tween_name)];
                    //console.log(tween_name);
                }
                tween_name = tween_name.toLowerCase();
            }
            if (state.metadata.tween_snap!==undefined) {
                tween_snap = Math.max(parseInt(state.metadata.tween_snap), 1);
            }

            //Apply

            if (EasingFunctions[tween_name] != null) {
                tween = EasingFunctions[tween_name](tween);
            }
            tween = Math.floor(tween * tween_snap) / tween_snap;

            for (var k = 0; k < state.idDict.length; k++) {
                var object = state.objects[state.idDict[k]];
                var layerID = object.layer;

                for (var i = Math.max(mini - renderBorderSize, 0); i < Math.min(maxi + renderBorderSize, curlevel.width); i++) {
                    for (var j = Math.max(minj - renderBorderSize, 0); j < Math.min(maxj + renderBorderSize, curlevel.height); j++) {
                        var posIndex = j + i * curlevel.height;
                        var posMask = curlevel.getCellInto(posIndex,_o12);                
                    
                        if (posMask.get(k) != 0) {                  
                            var spriteX = (k % spritesheetSize)|0;
                            var spriteY = (k / spritesheetSize)|0;

                            
                        //console.log(posIndex + " " + layerID);
    
                            var x = xoffset + (i-mini-cameraOffset.x) * cellwidth;
                            var y = yoffset + (j-minj-cameraOffset.y) * cellheight;
    
                            if (currentMovedEntities && currentMovedEntities["p"+posIndex+"-l"+layerID]) {
                                var dir = currentMovedEntities["p"+posIndex+"-l"+layerID];

                                if (dir != 16) { //Cardinal directions
                                    var delta = dirMasksDelta[dir];
                
                                    x -= cellwidth*delta[0]*tween
                                    y -= cellheight*delta[1]*tween
                                } else if (dir == 16) { //Action button
                                    ctx.globalAlpha = 1-tween;
                                }
                            }
                            
                            ctx.drawImage(
                                spritesheetCanvas, 
                                spriteX * cellwidth, spriteY * cellheight, cellwidth, cellheight,
                                Math.floor(x), Math.floor(y), cellwidth, cellheight);
                            ctx.globalAlpha = 1;
                        }
                    }
                }
            }
        }
        
        if (diffToVisualize!==null){
            //find previous state (this is never called on the very first state, the one before player inputs are applied, so there is always a previous state)
            var prevstate_lineNumberIndex=diffToVisualize.lineNumber-1;
            for (;prevstate_lineNumberIndex>=-1;prevstate_lineNumberIndex--)
            {
                if (debug_visualisation_array[diffToVisualize.turnIndex].hasOwnProperty(prevstate_lineNumberIndex)){
                    break;
                }
            }

            var prev_state = debug_visualisation_array[diffToVisualize.turnIndex][prevstate_lineNumberIndex];
            var prevlevel = new Level(-1,prev_state.width,prev_state.height,prev_state.layerCount,prev_state.objects);
            prevlevel.movements = prev_state.movements;
        
            for (var i = mini; i < maxi; i++) {
                for (var j = minj; j < maxj; j++) {
                    var posIndex = j + i * curlevel.height;
                    var movementbitvec_PREV = prevlevel.getMovements(posIndex);
                    var movementbitvec = curlevel.getMovements(posIndex);
                    
                    var posMask_PREV = prevlevel.getCellInto(posIndex,_o11); 
                    var posMask = curlevel.getCellInto(posIndex,_o12); 
                    if (!movementbitvec.equals(movementbitvec_PREV) || !posMask.equals(posMask_PREV)){
                        ctx.drawImage(glyphHighlightDiff, xoffset + (i-mini) * cellwidth, yoffset + (j-minj) * cellheight);

                    }
                }
            }
        
            //draw movements!
            for (var i = mini; i < maxi; i++) {
                for (var j = minj; j < maxj; j++) {
                    var posIndex = j + i * curlevel.height;
                    var movementbitvec = curlevel.getMovements(posIndex);
                    for (var layer=0;layer<curlevel.layerCount;layer++) {
                        var layerMovement = movementbitvec.getshiftor(0x1f, 5*layer);
                        for (var k = 0; k < 5; k++) {
                            if ((layerMovement&Math.pow(2,k))!==0){
                                ctx.drawImage(editorGlyphMovements[k], xoffset + (i-mini) * cellwidth, yoffset + (j-minj) * cellheight);
                            }
                        }
                    }                             
                }
            }
        }

        if (smoothscreen) {
            if (state.metadata.smoothscreen.debug) {
                drawSmoothScreenDebug(ctx);
            }
            ctx.restore();
        }

	    if (levelEditorOpened) {
	    	drawEditorIcons(mini,minj);
	    }
    }
}

function drawSmoothScreenDebug(ctx) {
    ctx.save();

    var smoothscreenConfig = state.metadata.smoothscreen;
    var boundarySize = smoothscreenConfig.boundarySize;

    var playerPositions = getPlayerPositions();
    if (playerPositions.length > 0) {
        var playerPosition = {
            x: (playerPositions[0]/(level.height))|0,
            y: (playerPositions[0]%level.height)|0
        };

        var playerOffsetX = playerPosition.x - cameraPosition.x;
        var playerOffsetY = playerPosition.y - cameraPosition.y;

        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(
            xoffset + (Math.floor(screenwidth / 2) + playerOffsetX + 0.5) * cellwidth,
            yoffset + (Math.floor(screenheight / 2) + playerOffsetY + 0.5) * cellheight,
            cellwidth / 4,
            0, 2* Math.PI
        );
        ctx.fill()
    }

    var targetOffsetX = cameraPositionTarget.x - cameraPosition.x;
    var targetOffsetY = cameraPositionTarget.y - cameraPosition.y;

    ctx.fillStyle = '#0000ff';
    ctx.beginPath();
    ctx.arc(
        xoffset + (Math.floor(screenwidth / 2) + targetOffsetX) * cellwidth,
        yoffset + (Math.floor(screenheight / 2) + targetOffsetY) * cellheight,
        cellwidth / 8,
        0, 2* Math.PI
    );
    ctx.fill()

    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = cellwidth / 16;
    ctx.strokeRect(
        xoffset + (Math.floor(screenwidth / 2) + targetOffsetX - Math.floor(boundarySize.width / 2)) * cellwidth,
        yoffset + (Math.floor(screenheight / 2) + targetOffsetY - Math.floor(boundarySize.height / 2)) * cellheight,
        boundarySize.width * cellwidth,
        boundarySize.height * cellheight
    );

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        xoffset + Math.floor(screenwidth / 2) * cellwidth,
        yoffset + Math.floor(screenheight / 2) * cellheight,
        cellwidth / 4,
        0, 2* Math.PI
    );
    ctx.fill()

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = cellwidth / 8;
    ctx.strokeRect(
        xoffset + (Math.floor(screenwidth / 2) - Math.floor(boundarySize.width / 2)) * cellwidth,
        yoffset + (Math.floor(screenheight / 2) - Math.floor(boundarySize.height / 2)) * cellheight,
        boundarySize.width * cellwidth,
        boundarySize.height * cellheight
    );

    ctx.restore()
}

function drawEditorIcons(mini,minj) {
	var glyphCount = glyphImages.length;
	var glyphStartIndex=0;
	var glyphEndIndex = glyphImages.length;/*Math.min(
							glyphStartIndex+10,
							screenwidth-2,
							glyphStartIndex+Math.max(glyphCount-glyphStartIndex,0)
							);*/
	var glyphsToDisplay = glyphEndIndex-glyphStartIndex;

	ctx.drawImage(glyphPrintButton,xoffset-cellwidth,yoffset-cellheight*(1+editorRowCount));
	if (mouseCoordY===(-1-editorRowCount)&&mouseCoordX===-1) {
			ctx.drawImage(glyphMouseOver,xoffset-cellwidth,yoffset-cellheight*(1+editorRowCount));								
	}

	var ypos = editorRowCount-(-mouseCoordY-2)-1;
	var mouseIndex=mouseCoordX+(screenwidth-1)*ypos;

	for (var i=0;i<glyphsToDisplay;i++) {
		var glyphIndex = glyphStartIndex+i;
		var sprite = glyphImages[glyphIndex];
        var xpos=i%(screenwidth-1);
        var ypos=(i/(screenwidth-1))|0;
		ctx.drawImage(sprite,xoffset+(xpos)*cellwidth,yoffset+ypos*cellheight-cellheight*(1+editorRowCount));
		if (mouseCoordX>=0&&mouseCoordX<(screenwidth-1)&&mouseIndex===i) {
			ctx.drawImage(glyphMouseOver,xoffset+xpos*cellwidth,yoffset+ypos*cellheight-cellheight*(1+editorRowCount));						
		}
		if (i===glyphSelectedIndex) {
			ctx.drawImage(glyphHighlight,xoffset+xpos*cellwidth,yoffset+ypos*cellheight-cellheight*(1+editorRowCount));
		} 		
	}

    //filched from https://raw.githubusercontent.com/ClementSparrow/Pattern-Script/master/src/js/graphics.js
    var tooltip_string = ''
    var tooltip_objects = null
    // prepare tooltip: legend for highlighted editor icon
    if ( (mouseCoordX >= 0) && (mouseCoordX < screenwidth) && (mouseIndex >= 0) && (mouseIndex < glyphsToDisplay) )
    {
        const glyphIndex = glyphStartIndex + mouseIndex
        const identifier_index = glyphImagesCorrespondance[glyphIndex]
        tooltip_string = identifier_index 
        if (identifier_index in state.synonymsDict){
            tooltip_string += " = " + state.synonymsDict[identifier_index];
        } else if (identifier_index in state.aggregatesDict){
            tooltip_string += " = " + state.aggregatesDict[identifier_index].join(" and ");
            
        }
    }
    // prepare tooltip: content of a level's cell
    else if ( (mouseCoordX >= 0) && (mouseCoordY >= 0) && (mouseCoordX < screenwidth) && (mouseCoordY < screenheight-editorRowCount) )
    {
        const posMask = level.getCellInto((mouseCoordY+minj) + (mouseCoordX+mini)*level.height, _o12);
        tooltip_objects = state.idDict.filter( (x,k) => (posMask.get(k) != 0) )
            // prepare tooltip: object names
        if (tooltip_objects !== null)
        {
            tooltip_string = tooltip_objects.join(', ')
        }
    }

    // show tooltip
    if (tooltip_string.length > 0)
    {
        ctx.fillStyle = state.fgcolor;
        ctx.font = `16px "Source Sans Pro", Helvetica, Arial, sans-serif`;
        ctx.fillText(tooltip_string, xoffset, yoffset-0.4*cellheight);
    }

	if (mouseCoordX>=-1&&mouseCoordY>=-1&&mouseCoordX<screenwidth-1&&mouseCoordY<screenheight-1-editorRowCount) {
		if (mouseCoordX==-1||mouseCoordY==-1||mouseCoordX==screenwidth-2||mouseCoordY===screenheight-2-editorRowCount) {
			ctx.drawImage(glyphHighlightResize,
				xoffset+mouseCoordX*cellwidth,
				yoffset+mouseCoordY*cellheight
				);								
		} else {
			ctx.drawImage(glyphHighlight,
				xoffset+mouseCoordX*cellwidth,
				yoffset+mouseCoordY*cellheight
				);				
		}
	}

}

var lastDownTarget;

var oldcellwidth=0;
var oldcellheight=0;
var oldtextmode=-1;
var oldfgcolor=-1;
var forceRegenImages=false;

var textcellwidth = 0;
var textcellheight = 0;

function canvasResize() {
    canvas.width = canvas.parentNode.clientWidth;
    canvas.height = canvas.parentNode.clientHeight;

    screenwidth=level.width;
    screenheight=level.height;
    if (state!==undefined){
        flickscreen=state.metadata.flickscreen!==undefined;
        zoomscreen=state.metadata.zoomscreen!==undefined;
        smoothscreen=state.metadata.smoothscreen!==undefined;
	    if (levelEditorOpened) {
            screenwidth+=2;
            var glyphcount = glyphCount();
            editorRowCount = Math.ceil(glyphcount/(screenwidth-1));
            screenheight+=2+editorRowCount;
        } else if (flickscreen) {
	        screenwidth=state.metadata.flickscreen[0];
	        screenheight=state.metadata.flickscreen[1];
	    } else if (zoomscreen) {
	        screenwidth=state.metadata.zoomscreen[0];
	        screenheight=state.metadata.zoomscreen[1];
	    } else if (smoothscreen) {
	        screenwidth=state.metadata.smoothscreen.screenSize.width;
	        screenheight=state.metadata.smoothscreen.screenSize.height;
	    }
	}

    if (textMode) {
        screenwidth=titleWidth;
        screenheight=titleHeight;
    }
    
    cellwidth = canvas.width / screenwidth;
    cellheight = canvas.height / screenheight;

    var w = 5;
    var h = 5;

    if (sprites.length >= 2) {
        var w = sprites[1].dat.length;
        var h = sprites[1].dat.length;//sprites[1].dat[0].length;
    }

    if (textMode) {
        w=5 + 1;
        h=font['X'].length/(w) + 1;
    }


    cellwidth =w * Math.max( ~~(cellwidth / w),1);
    cellheight = h * Math.max(~~(cellheight / h),1);

    if ((cellwidth == 0 || cellheight == 0) && !textMode) {
        cellwidth = w;
        cellheight = h;
        console.log("Resized below 1");
    }

    xoffset = 0;
    yoffset = 0;

    if (cellwidth / w > cellheight / h  || (textMode && state.metadata.custom_font !== undefined && loadedCustomFont)) {
        cellwidth = cellheight * w / h;
        xoffset = (canvas.width - cellwidth * screenwidth) / 2;
        yoffset = (canvas.height - cellheight * screenheight) / 2;
    }
    else { //if (cellheight > cellwidth) {
        cellheight = cellwidth * h / w;
        yoffset = (canvas.height - cellheight * screenheight) / 2;
        xoffset = (canvas.width - cellwidth * screenwidth) / 2;
    }

    if (levelEditorOpened && !textMode) {
    	xoffset+=cellwidth;
    	yoffset+=cellheight*(1+editorRowCount);
    }

    cellwidth = cellwidth|0;
    cellheight = cellheight|0;
    xoffset = xoffset|0;
    yoffset = yoffset|0;

    if (textMode) {
        textcellwidth = cellwidth;
        textcellheight = cellheight;
    }

    if (oldcellwidth!=cellwidth||oldcellheight!=cellheight||oldtextmode!=textMode||textMode||oldfgcolor!=state.fgcolor||forceRegenImages){
    	forceRegenImages=false;
    	regenSpriteImages();
    }

    oldcellheight=cellheight;
    oldcellwidth=cellwidth;
    oldtextmode=textMode;
    oldfgcolor=state.fgcolor;

    redraw();
}

//Source: https://gist.github.com/gre/1650294
/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
  const EasingFunctions = {
    // no easing, no acceleration
    linear: t => t,
    // accelerating from zero velocity
    easeinquad: t => t*t,
    // decelerating to zero velocity
    easeoutquad: t => t*(2-t),
    // acceleration until halfway, then deceleration
    easeinoutquad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
    // accelerating from zero velocity 
    easeincubic: t => t*t*t,
    // decelerating to zero velocity 
    easeoutcubic: t => (--t)*t*t+1,
    // acceleration until halfway, then deceleration 
    easeinoutcubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
    // accelerating from zero velocity 
    easeinquart: t => t*t*t*t,
    // decelerating to zero velocity 
    easeoutquart: t => 1-(--t)*t*t*t,
    // acceleration until halfway, then deceleration
    easeinoutquart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
    // accelerating from zero velocity
    easeinquint: t => t*t*t*t*t,
    // decelerating to zero velocity
    easeoutquint: t => 1+(--t)*t*t*t*t,
    // acceleration until halfway, then deceleration 
    easeinoutquint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
  }

  const easingAliases = {
      1: "linear",
      2: "easeInQuad",
      3: "easeOutQuad",
      4: "easeInOutQuad",
      5: "easeInCubic",
      6: "easeOutCubic",
      7: "easeInOutCubic",
      8: "easeInQuart",
      9: "easeOutQuart",
      10: "easeInOutQuart",
      11: "easeInQuint",
      12: "easeOutQuint",
      13: "easeInOutQuint"
  }
// @@end js/graphics.js


// @@begin js/mobile.js
/*
 * Add gesture support for mobile devices.
 */

window.Mobile = {};

//stolen from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js
Mobile.hasTouch = function() {
    var bool;
    if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch)     {
      bool = true;
    } else {
      /*
      //don't know what's happening with this, so commented it out
      var query = ['@media (',prefixes.join('touch-enabled),    ('),'heartz',')','{#modernizr{top:9px;position:absolute}}'].join('');
      testStyles(query, function( node ) {
        bool = node.offsetTop === 9;
      });*/
    }
    return bool;
}

Mobile.enable = function (force) {
    if (force || Mobile.hasTouch() && !Mobile._instance) {
        Mobile._instance = new Mobile.GestureHandler();
        Mobile._instance.bindEvents();
        Mobile._instance.bootstrap();
    }
    return Mobile._instance;
};

window.Mobile.GestureHandler = function () {
    this.initialize.apply(this, arguments);
};

Mobile.log = function (message) {
    var h1;
    h1 = document.getElementsByTagName('h1')[0];
    h1.innerHTML = "" + Math.random().toString().substring(4, 1) + "-" + message;
};

Mobile.debugDot = function (event) {
    var dot, body, style

    style = 'border-radius: 50px;' +
        'width: 5px;' +
        'height: 5px;' +
        'background: red;' +
        'position: absolute;' +
        'left: ' + event.touches[0].clientX + 'px;' +
        'top: ' + event.touches[0].clientY + 'px;';
    dot = document.createElement('div');
    dot.setAttribute('style', style);
    body = document.getElementsByTagName('body')[0];
    body.appendChild(dot);
};

(function (proto) {
    'use strict';

    // Minimum range to begin looking at the swipe direction, in pixels
    var SWIPE_THRESHOLD = 10;
    // Distance in pixels required to complete a swipe gesture.
    var SWIPE_DISTANCE = 50;
    // Time in milliseconds to complete the gesture.
    var SWIPE_TIMEOUT = 1000;
    // Time in milliseconds to repeat a motion if still holding down,
    // ... and not specified in state.metadata.key_repeat_interval.
    var DEFAULT_REPEAT_INTERVAL = 150;

    // Lookup table mapping action to keyCode.
    var CODE = {
        action:  88, // x
        left:    37, // left arrow
        right:   39, // right arrow
        up:      38, // up arrow
        down:    40, // down arrow
        undo:    85, // u
        restart: 82, // r
        quit:    27 // escape
    }

    var TAB_STRING = [
        '<div class="tab">',
        '  <div class="tab-affordance"></div>',
        '  <div class="tab-icon">',
        '    <div class="slice"></div>',
        '    <div class="slice"></div>',
        '  </div>',
        '</div>'
    ].join("\n");

    /** Bootstrap Methods **/

    proto.initialize = function () {
        this.firstPos = { x: 0, y: 0 };
        this.setTabAnimationRatio = this.setTabAnimationRatio.bind(this);
        this.setMenuAnimationRatio = this.setMenuAnimationRatio.bind(this);
        this.repeatTick = this.repeatTick.bind(this);
        this.isFocused = true;
    };

    // assign the element that will allow tapping to toggle focus.
    proto.setFocusElement = function (focusElement) {
        this.focusElement = focusElement;
        this.isFocused = false;
        this.buildFocusIndicator();
    };

    proto.bindEvents = function () {
        window.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
    };

    proto.bootstrap = function () {
        this.showTab();
        this.disableScrolling();
        if (!this.isAudioSupported()) {
            this.disableAudio();
        }
        this.disableSelection();
    };

    /** Event Handlers **/

    proto.onTouchStart = function (event) {
        if (this.isTouching) {
            return;
        }

        // Handle focus changes used in editor.
        this.handleFocusChange(event);
        if (!this.isFocused) {
            return;
        }

        if (event.target.tagName.toUpperCase() === 'A') {
            return;
        }
        this.isTouching = true;

        this.mayBeSwiping = true;
        this.gestured = false;

        this.swipeDirection = undefined;
        this.swipeDistance = 0;
        this.startTime = new Date().getTime();

        this.firstPos.x = event.touches[0].clientX;
        this.firstPos.y = event.touches[0].clientY;
    };

    proto.onTouchEnd = function (event) {
        if (!this.isFocused) {
            return;
        }
        if (!this.isTouching) {
            // If we're here, the menu event handlers had probably
            // canceled the touchstart event.
            return;
        }
        if (!this.gestured) {
            if (event.touches.length === 0 && event.target.id!=="unMuteButton" && event.target.id!=="muteButton" ) {
                this.handleTap();
            }
        }

        // The last finger to be removed from the screen lets us know
        // we aren't tracking anything.
        if (event.touches.length === 0) {
            this.isTouching = false;
            this.endRepeatWatcher();
        }
    };

    proto.onTouchMove = function (event) {
        if (!this.isFocused) {
            return;
        }
        if (levelEditorOpened){
            return;
        }
        if (this.isSuccessfulSwipe()) {
            this.handleSwipe(this.swipeDirection, this.touchCount);
            this.gestured = true;
            this.mayBeSwiping = false;
            this.beginRepeatWatcher(event);
        } else if (this.mayBeSwiping) {
            this.swipeStep(event);
        } else if (this.isRepeating) {
            this.repeatStep(event);
        }

        prevent(event);
        return false;
    };

    proto.handleFocusChange = function (event) {
        if (!this.focusElement) {
            return;
        }

        this.isFocused = this.isTouchInsideFocusElement(event);
        this.setFocusIndicatorVisibility(this.isFocused);
        
        canvas.focus();
        editor.display.input.blur();
    };

    proto.isTouchInsideFocusElement = function (event) {
        var canvasPosition;

        if (!event.touches || !event.touches[0]) {
            return false;
        }
        canvasPosition = this.absoluteElementPosition(this.focusElement);

        if (event.touches[0].clientX < canvasPosition.left ||
            event.touches[0].clientY < canvasPosition.top) {
            return false;
        }

        if (event.touches[0].clientX > canvasPosition.left + this.focusElement.clientWidth ||
            event.touches[0].clientY > canvasPosition.top + this.focusElement.clientHeight) {
            return false;
        }

        return true;
    };

    proto.setFocusIndicatorVisibility = function (isVisible) {
        var visibility;

        visibility = 'visible';
        if (!isVisible) {
            visibility = 'hidden';
        }
        // this.focusIndicator.setAttribute('style', 'visibility: ' + visibility + ';');
    };

    proto.absoluteElementPosition = function (element) {
        var position, body;

        position = {
            top: element.offsetTop || 0,
            left: element.offsetLeft || 0
        };
        body = document.getElementsByTagName('body')[0];
        position.top -= body.scrollTop || 0;

        while (true) {
            element = element.offsetParent;
            if (!element) {
                break;
            }
            position.top += element.offsetTop || 0;
            position.left += element.offsetLeft || 0;
        }

        return position;
    };

    proto.beginRepeatWatcher = function (event) {
        var repeatIntervalMilliseconds;
        if (this.repeatInterval) {
            return;
        }
        this.isRepeating = true;
        repeatIntervalMilliseconds = state.metadata.key_repeat_interval * 1000;
        if (isNaN(repeatIntervalMilliseconds) || !repeatIntervalMilliseconds) {
            repeatIntervalMilliseconds = DEFAULT_REPEAT_INTERVAL;
        }
        this.repeatInterval = setInterval(this.repeatTick, repeatIntervalMilliseconds);
        this.recenter(event);
    };

    proto.endRepeatWatcher = function () {
        if (this.repeatInterval) {
            clearInterval(this.repeatInterval);
            delete this.repeatInterval;
            this.isRepeating = false;
        }
    };

    proto.repeatTick = function () {
        if (this.isTouching) {
            this.handleSwipe(this.direction, this.touchCount);
        }
    };

    // Capture the location to consider the gamepad center.
    proto.recenter = function (event) {
        this.firstPos.x = event.touches[0].clientX;
        this.firstPos.y = event.touches[0].clientY;
    }

    /** Detection Helper Methods **/

    proto.isSuccessfulSwipe = function () {
        var isSuccessful;

        if (this.mayBeSwiping &&
            this.swipeDirection !== undefined &&
            this.swipeDistance >= SWIPE_DISTANCE) {
            isSuccessful = true;
        }

        return isSuccessful;
    };

    // Examine the current state to see what direction they're swiping and
    // if the gesture can still be considered a swipe.
    proto.swipeStep = function (event) {
        var currentPos, distance, currentTime;
        var touchCount;

        if (!this.mayBeSwiping) {
            return;
        }

        currentPos = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        currentTime = new Date().getTime();
        touchCount = event.touches.length;

        this.swipeDistance = this.cardinalDistance(this.firstPos, currentPos);
        if (!this.swipeDirection) {
            if (this.swipeDistance > SWIPE_THRESHOLD) {
                // We've swiped far enough to decide what direction we're swiping in.
                this.swipeDirection = this.dominantDirection(this.firstPos, currentPos);
                this.touchCount = touchCount;
            }
        } else if (distance < SWIPE_DISTANCE) {
            // Now that they've committed to the swipe, look for misfires...

            direction = this.dominantDirection(this.firstPos, currentPos);
            // Cancel the swipe if the direction changes.
            if (direction !== this.swipeDirection) {
                this.mayBeSwiping = false;
            }
            // If they're changing touch count at this point, it's a misfire.
            if (touchCount < this.touchCount) {
                this.mayBeSwiping = false;
            }
        } else if (currentTime - this.startTime > SWIPE_TIMEOUT) {
            // Cancel the swipe if they took too long to finish.
            this.mayBeSwiping = false;
        }
    };

    proto.repeatStep = function (event) {
        var currentPos, distance, currentTime;
        var newDistance, direction;

        currentPos = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };

        newDistance = this.cardinalDistance(this.firstPos, currentPos);

        if (newDistance >= SWIPE_DISTANCE) {
            this.swipeDirection = this.dominantDirection(this.firstPos, currentPos);
            this.recenter(event);
        }
    };

    // Find the distance traveled by the swipe along compass directions.
    proto.cardinalDistance = function (firstPos, currentPos) {
        var xDist, yDist;

        xDist = Math.abs(firstPos.x - currentPos.x);
        yDist = Math.abs(firstPos.y - currentPos.y);

        return Math.max(xDist, yDist);
    };

    // Decide which direction the touch has moved farthest.
    proto.dominantDirection = function (firstPos, currentPos) {
        var dx, dy;
        var dominantAxis, dominantDirection;

        dx = currentPos.x - firstPos.x;
        dy = currentPos.y - firstPos.y;

        dominantAxis = 'x';
        if (Math.abs(dy) > Math.abs(dx)) {
            dominantAxis = 'y';
        }

        if (dominantAxis === 'x') {
            if (dx > 0) {
                dominantDirection = 'right';
            } else {
                dominantDirection = 'left';
            }
        } else {
            if (dy > 0) {
                dominantDirection = 'down';
            } else {
                dominantDirection = 'up';
            }
        }

        return dominantDirection;
    };

    /** Action Methods **/

    // Method to be called when we've detected a swipe and some action
    // is called for.
    proto.handleSwipe = function (direction, touchCount) {
        if (IsMouseGameInputEnabled()) {
            return;
        }

        if (touchCount === 1) {
            this.emitKeydown(this.swipeDirection);
        } else if (touchCount > 1) {
            // Since this was a multitouch gesture, open the menu.
            this.toggleMenu();
        }
    };

    proto.handleTap = function () {
        if (IsMouseGameInputEnabled()) {
            return;
        }

        this.emitKeydown('action');
    };

    // Fake out keypresses to acheive the desired effect.
    proto.emitKeydown = function (input) {
        if(!this.isMenuVisible && (input == 'undo' || input == 'restart' || input == 'quit')) {
            return;
        }

        var event;

        event = { keyCode: CODE[input] };

        this.fakeCanvasFocus();
        // Press, then release key.
        onKeyDown(event);
        onKeyUp(event);
    };

    proto.fakeCanvasFocus = function () {
        var canvas;

        canvas = document.getElementById('gameCanvas');
        onMouseDown({
            button: 0,
            target: canvas
        });
    };

    proto.toggleMenu = function () {
        if (this.isMenuVisible) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    };

    proto.showMenu = function () {
        if (!this.menuElem) {
            this.buildMenu();
        }
        this.getAnimatables().menu.animateUp();
        this.isMenuVisible = true;
        this.hideTab();
    };

    proto.hideMenu = function () {
        if (this.menuElem) {
            this.getAnimatables().menu.animateDown();
        }
        this.isMenuVisible = false;
        this.showTab();
    };

    proto.getAnimatables = function () {
        var self = this;
        if (!this._animatables) {
            this._animatables = {
                tab: Animatable('tab', 0.1, self.setTabAnimationRatio),
                menu: Animatable('menu', 0.1, self.setMenuAnimationRatio)
            }
        }
        return this._animatables;
    };

    proto.showTab = function () {
        if (!this.tabElem) {
            this.buildTab();
        }
        this.getAnimatables().tab.animateDown();
    };

    proto.hideTab = function () {
        if (this.tabElem) {
            this.tabElem.setAttribute('style', 'display: none;');
        }
        this.getAnimatables().tab.animateUp();
    };

    proto.buildTab = function () {
        var self = this;
        var tempElem, body;
        var openCallback;
        var tabElem;
        var assemblyElem;

        tempElem = document.createElement('div');
        tempElem.innerHTML = TAB_STRING;
        assemblyElem = tempElem.children[0];

        openCallback = function (event) {
            event.stopPropagation();
            self.showMenu();
        };
        this.tabAffordance = assemblyElem.getElementsByClassName('tab-affordance')[0];
        this.tabElem = assemblyElem.getElementsByClassName('tab-icon')[0];

        //the reason I'm adding all these empty click events is on safari to disable double-tap to zoom (also needs some other css settings. cf https://github.com/increpare/PuzzleScript/issues/599 SMGDH)
        this.tabAffordance.addEventListener('touchstart', openCallback);
        this.tabAffordance.addEventListener("click", event => {});
        this.tabElem.addEventListener('touchstart', openCallback);
        this.tabElem.addEventListener("click", event => {});

        body = document.getElementsByTagName('body')[0];
        body.appendChild(assemblyElem);
    };

    proto.buildMenu = function () {
        var self = this;
        var tempElem, body;
        var undo, restart, quit;
        var closeTab;
        var closeCallback;

        tempElem = document.createElement('div');
        tempElem.innerHTML = this.buildMenuString(state);
        this.menuElem = tempElem.children[0];
        this.closeElem = this.menuElem.getElementsByClassName('close')[0];

        closeCallback = function (event) {
            event.stopPropagation();
            self.hideMenu();
        };
        this.closeAffordance = this.menuElem.getElementsByClassName('close-affordance')[0];
        closeTab = this.menuElem.getElementsByClassName('close')[0];
        this.closeAffordance.addEventListener('touchstart', closeCallback);
        this.closeAffordance.addEventListener("click", event => {});
        closeTab.addEventListener('touchstart', closeCallback);
        closeTab.addEventListener("click", event => {});

        undo = this.menuElem.getElementsByClassName('undo')[0];
        if (undo) {
            undo.addEventListener('touchstart', function (event) {
                event.stopPropagation();
                self.emitKeydown('undo');
            });
            undo.addEventListener("click", event => {});
        }
        restart = this.menuElem.getElementsByClassName('restart')[0];
        if (restart) {
            restart.addEventListener('touchstart', function (event) {
                event.stopPropagation();
                self.emitKeydown('restart');
            });
            restart.addEventListener("click", event => {});
        }

        quit = this.menuElem.getElementsByClassName('quit')[0];
        quit.addEventListener('touchstart', function (event) {
            event.stopPropagation();
            self.emitKeydown('quit');
        });
        quit.addEventListener("click", event => {});

        body = document.getElementsByTagName('body')[0];
        body.appendChild(this.menuElem);
    };

    proto.buildMenuString = function (state) {
    // Template for the menu.
        var itemCount, menuLines;
        var noUndo, noRestart;

        noUndo = state.metadata.noundo;
        noRestart = state.metadata.norestart;

        itemCount = 3;
        if (noUndo) {
            itemCount -= 1;
        }
        if (noRestart) {
            itemCount -= 1;
        }

        menuLines = [
            '<div class="mobile-menu item-count-' + itemCount + '">',
            '  <div class="close-affordance"></div>',
            '  <div class="close">',
            '    <div class="slice"></div>',
            '    <div class="slice"></div>',
            '  </div>'
        ];

        if (!noUndo) {
            menuLines.push('  <div class="undo button">Undo</div>');
        }
        if (!noRestart) {
            menuLines.push('  <div class="restart button">Restart</div>');
        }
        menuLines = menuLines.concat([
            '  <div class="quit button">Quit to Menu</div>',
            '  <div class="clear"></div>',
            '</div>'
        ]);

        return menuLines.join("\n");
    };

    proto.buildFocusIndicator = function () {
        var focusElementParent;
        this.focusIndicator = document.createElement('DIV');
        this.focusIndicator.setAttribute('class', 'tapFocusIndicator');
        this.focusIndicator.setAttribute('style', 'visibility: hidden;');

        focusElementParent = this.focusElement.parentNode;
        focusElementParent.appendChild(this.focusIndicator);
    };

    proto.setTabAnimationRatio = function (ratio) {
        var LEFT = 18;
        var RIGHT = 48 + 18;
        var size, opacityString;
        var style;

        // Round away any exponents that might appear.
        ratio = Math.round((ratio) * 1000) / 1000;
        if (ratio >= 0.999) {
            this.tabAffordance.setAttribute('style', 'display: none;');
        } else {
            this.tabAffordance.setAttribute('style', 'display: block;');
        }
        size = RIGHT * ratio + LEFT * (1 - ratio);
        opacityString = 'opacity: ' + (1 - ratio) + ';';
        style = opacityString + ' ' +
            'width: ' + size + 'px;';
        this.tabElem.setAttribute('style', style);
    };

    proto.setMenuAnimationRatio = function (ratio) {
        var LEFT = -48 - 18;
        var RIGHT = -18;
        var size, opacityString;
        var style;

        // Round away any exponents that might appear.
        ratio = Math.round((ratio) * 1000) / 1000;

        size = RIGHT * ratio + LEFT * (1 - ratio);
        opacityString = 'opacity: ' + ratio + ';';
        style = 'left: ' + (size - 4) + 'px; ' +
            opacityString + ' ' +
            'width: ' + (-size) + 'px;';
        ratio = Math.round((ratio) * 1000) / 1000;

        if (ratio <= 0.001) {
            this.closeAffordance.setAttribute('style', 'display: none;');
            opacityString="display:none;"
        } else {
            this.closeAffordance.setAttribute('style', 'display: block;');
        }

        this.closeElem.setAttribute('style', style);

        this.menuElem.setAttribute('style', opacityString);
    };

    proto.disableScrolling = function() {
        var style = {
            height: "100%",
            overflow: "hidden",
            position: "fixed",
            width: "100%",
            margin: 0
        }
        
        var styleString = "";
        for (var key in style) {
            styleString += key + ": " + style[key] + "; ";
        }

        document.body.setAttribute('style', styleString)
    }

    /** Audio Methods **/

    proto.disableAudio = function () {
        // Overwrite the playseed function to disable it.
        window.playSeed = function () {};
    };

    proto.isAudioSupported = function () {
        var isAudioSupported = true;

        if (typeof webkitAudioContext !== 'undefined') {
            // We may be on Mobile Safari, which throws up
            // 'Operation not Supported' alerts when we attempt to
            // play Audio elements with "data:audio/wav;base64"
            // encoded HTML5 Audio elements.
            //
            // Switching to MP3 encoded audio may be the way we have
            // to go to get Audio working on mobile devices.
            //
            // e.g. https://github.com/rioleo/webaudio-api-synthesizer
            isAudioSupported = false;
        }

        return isAudioSupported;
    };

    /** Other HTML5 Stuff **/

    proto.disableSelection = function () {
        var body;
        body = document.getElementsByTagName('body')[0];
        body.setAttribute('class', body.getAttribute('class') + ' disable-select');
    };

}(window.Mobile.GestureHandler.prototype));

window.Animator = function () {
    this.initialize.apply(this, arguments);
};

(function (proto) {
    proto.initialize = function () {
        this._animations = {};
        this.tick = this.tick.bind(this);
    };

    proto.animate = function (key, tick) {
        this._animations[key] = tick;
        this.wakeup();
    };

    proto.wakeup = function () {
        if (this._isAnimating) {
            return;
        }
        this._isAnimating = true;
        this.tick();
    };

    proto.tick = function () {
        var key;
        var isFinished, allFinished;
        var toRemove, index;

        toRemove = [];
        allFinished = true;
        for (key in this._animations) {
            if (!this._animations.hasOwnProperty(key)) {
                return;
            }
            isFinished = this._animations[key]();
            if (!isFinished) {
                allFinished = false;
            } else {
                toRemove.push(key);
            }
        }

        if (!allFinished) {
            requestAnimationFrame(this.tick);
        } else {
            for (index = 0; index < toRemove.length; toRemove++) {
                delete this._isAnimating[toRemove[index]];
            }
            this._isAnimating = false;
        }
    };

}(window.Animator.prototype));

window.Animator.getInstance = function () {
    if (!window.Animator._instance) {
        window.Animator._instance = new window.Animator();
    }
    return window.Animator._instance;
};

function Animatable(key, increment, update) {
    var ratio;
    var handles;

    handles = {
        animateUp: function () {
            Animator.getInstance().animate(key, tickUp);
        },
        animateDown: function () {
            Animator.getInstance().animate(key, tickDown);
        }
    };

    ratio = 0;

    function tickUp () {
        var isFinished;
        ratio += increment;
        if (ratio >= 1.0) {
            isFinished = true;
            ratio = 1;
        }
        update(ratio);
        return isFinished;
    };

    function tickDown () {
        var isFinished;
        ratio -= increment;
        if (ratio <= 0.0) {
            isFinished = true;
            ratio = 0;
        }
        update(ratio);
        return isFinished;
    };

    return handles;
};


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
    'use strict';

    var VENDORS = ['ms', 'moz', 'webkit', 'o'];
    var index, lastTime;

    for (index = 0; index < VENDORS.length && !window.requestAnimationFrame; index++) {
        window.requestAnimationFrame = window[VENDORS[index] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[VENDORS[index] + 'CancelAnimationFrame'];
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = window[VENDORS[index] + 'CancelRequestAnimationFrame'];
        }
    }

    if (!window.requestAnimationFrame) {
        lastTime = 0;
        window.requestAnimationFrame = function(callback, element) {
            var currTime, timeToCall, id;

            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;

            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

    Mobile.enable();
}());

// @@end js/mobile.js


// @@begin js/inputoutput.js
var keyRepeatTimer=0;
var keyRepeatIndex=0;
var input_throttle_timer=0.0;
var lastinput=-100;

var dragging=false;
var rightdragging=false;
var columnAdded=false;

function selectText(containerid,e) {
	e = e || window.event;
	var myspan = document.getElementById(containerid);
	if (e&&(e.ctrlKey || e.metaKey)) {
		if(solving) return;
		var levelarr = ["console"].concat(myspan.innerHTML.split("<br>"));
		var leveldat = levelFromString(state,levelarr);
		loadLevelFromLevelDat(state,leveldat,null);
		canvasResize();
	} else {
	    if (document.selection) {
	        var range = document.body.createTextRange();
	        range.moveToElementText(myspan);
	        range.select();
	    } else if (window.getSelection) {
	        var range = document.createRange();
	        range.selectNode(myspan);
			var selection = window.getSelection();
			//why removeallranges? https://stackoverflow.com/a/43443101 whatever...
			selection.removeAllRanges();
	        selection.addRange(range);
	    }
	}
}

function recalcLevelBounds(){
}

function arrCopy(from, fromoffset, to, tooffset, len) {
	while (len--)
		to[tooffset++] = from[fromoffset]++;
}

function adjustLevel(level, widthdelta, heightdelta) {
	backups.push(backupLevel());
	var oldlevel = level.clone();
	level.width += widthdelta;
	level.height += heightdelta;
	level.n_tiles = level.width * level.height;
	level.objects = new Int32Array(level.n_tiles * STRIDE_OBJ);
	var bgMask = new BitVec(STRIDE_OBJ);
	bgMask.ibitset(state.backgroundid);
	for (var i=0; i<level.n_tiles; ++i) 
		level.setCell(i, bgMask);
	level.movements = new Int32Array(level.objects.length);
	columnAdded=true;
	RebuildLevelArrays();
	return oldlevel;
}

function addLeftColumn() {
	var oldlevel = adjustLevel(level, 1, 0);
	for (var x=1; x<level.width; ++x) {
		for (var y=0; y<level.height; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index - level.height))
		}
	}
}

function addRightColumn() {
	var oldlevel = adjustLevel(level, 1, 0);
	for (var x=0; x<level.width-1; ++x) {
		for (var y=0; y<level.height; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index))
		}
	}
}

function addTopRow() {
	var oldlevel = adjustLevel(level, 0, 1);
	for (var x=0; x<level.width; ++x) {
		for (var y=1; y<level.height; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index - x - 1))
		}
	}
}

function addBottomRow() {
	var oldlevel = adjustLevel(level, 0, 1);
	for (var x=0; x<level.width; ++x) {
		for (var y=0; y<level.height - 1; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index - x));
		}
	}
}

function removeLeftColumn() {
	if (level.width<=1) {
		return;
	}
	var oldlevel = adjustLevel(level, -1, 0);
	for (var x=0; x<level.width; ++x) {
		for (var y=0; y<level.height; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index + level.height))
		}
	}
}

function removeRightColumn(){
	if (level.width<=1) {
		return;
	}
	var oldlevel = adjustLevel(level, -1, 0);
	for (var x=0; x<level.width; ++x) {
		for (var y=0; y<level.height; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index))
		}
	}
}

function removeTopRow(){
	if (level.height<=1) {
		return;
	}
	var oldlevel = adjustLevel(level, 0, -1);
	for (var x=0; x<level.width; ++x) {
		for (var y=0; y<level.height; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index + x + 1))
		}
	}
}
function removeBottomRow(){
	if (level.height<=1) {
		return;
	}
	var oldlevel = adjustLevel(level, 0, -1);
	for (var x=0; x<level.width; ++x) {
		for (var y=0; y<level.height; ++y) {
			var index = x*level.height + y;
			level.setCell(index, oldlevel.getCell(index + x))
		}
	}
}

function matchGlyph(inputmask,glyphAndMask) {
	// find mask with closest match
	var highestbitcount=-1;
	var highestmask;
	for (var i=0; i<glyphAndMask.length; ++i) {
		var glyphname = glyphAndMask[i][0];
		var glyphmask = glyphAndMask[i][1];
 		var glyphbits = glyphAndMask[i][2];
		//require all bits of glyph to be in input
		if (glyphmask.bitsSetInArray(inputmask.data)) {
			var bitcount = 0;
			for (var bit=0;bit<32*STRIDE_OBJ;++bit) {
				if (glyphbits.get(bit) && inputmask.get(bit))
 					bitcount++;
				if (glyphmask.get(bit) && inputmask.get(bit))
					bitcount++;
			}
			if (bitcount>highestbitcount) {
				highestbitcount=bitcount;
				highestmask=glyphname;
			}
		}
	}
	if (highestbitcount>0) {
		return highestmask;
	}
	
	logErrorNoLine("Wasn't able to approximate a glyph value for some tiles, using '.' as a placeholder.",true);
	return '.';
}

var htmlEntityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

var selectableint  = 0;

function printLevel() {
	var glyphMasks = [];
	for (var glyphName in state.glyphDict) {
		if (state.glyphDict.hasOwnProperty(glyphName)&&glyphName.length===1) {
			var glyph = state.glyphDict[glyphName];
			var glyphmask=new BitVec(STRIDE_OBJ);
			for (var i=0;i<glyph.length;i++)
			{
				var id = glyph[i];
				if (id>=0) {
					glyphmask.ibitset(id);
				}
			}
			var glyphbits = glyphmask.clone();
			//register the same - backgroundmask with the same name
			var bgMask = state.layerMasks[state.backgroundlayer];
			glyphmask.iclear(bgMask);
			glyphMasks.push([glyphName, glyphmask, glyphbits]);
		}
	}
	selectableint++;
	var tag = 'selectable'+selectableint;
	var output="Printing level contents:<br><br><span id=\""+tag+"\" onclick=\"selectText('"+tag+"',event)\"><br>";
	cache_console_messages = false;
	for (var j=0;j<level.height;j++) {
		for (var i=0;i<level.width;i++) {
			var cellIndex = j+i*level.height;
			var cellMask = level.getCell(cellIndex);
			var glyph = matchGlyph(cellMask,glyphMasks);
			if (glyph in htmlEntityMap) {
				glyph = htmlEntityMap[glyph]; 
			}
			output = output+glyph;
		}
		if (j<level.height-1){
			output=output+"<br>";
		}
	}
	output+="</span><br><br>"
	consolePrint(output,true);
}

function levelEditorClick(event,click) {
	if (mouseCoordY<=-2) {
		var ypos = editorRowCount-(-mouseCoordY-2)-1;
		var newindex=mouseCoordX+(screenwidth-1)*ypos;
		if (mouseCoordX===-1) {
			printLevel();
		} else if (mouseCoordX>=0&&newindex<glyphImages.length) {
			glyphSelectedIndex=newindex;
			redraw();
		}

	} else if (mouseCoordX>-1&&mouseCoordY>-1&&mouseCoordX<screenwidth-2&&mouseCoordY<screenheight-2-editorRowCount	) {
		var glyphname = glyphImagesCorrespondance[glyphSelectedIndex];
		var glyph = state.glyphDict[glyphname];
		var glyphmask = new BitVec(STRIDE_OBJ);
		for (var i=0;i<glyph.length;i++)
		{
			var id = glyph[i];
			if (id>=0) {
				glyphmask.ibitset(id);
			}			
		}

		var backgroundMask = state.layerMasks[state.backgroundlayer];
		if (glyphmask.bitsClearInArray(backgroundMask.data)) {
			// If we don't already have a background layer, mix in
			// the default one.
			glyphmask.ibitset(state.backgroundid);
		}

		var coordIndex = mouseCoordY + mouseCoordX*level.height;
		var getcell = level.getCell(coordIndex);
		if (getcell.equals(glyphmask)) {
			return;
		} else {
			if (anyEditsSinceMouseDown===false) {
				anyEditsSinceMouseDown=true;				
        		backups.push(backupLevel());
			}
			level.setCell(coordIndex, glyphmask);
			redraw();
		}
	}
	else if (click) {
		if (mouseCoordX===-1) {
			//add a left row to the map
			addLeftColumn();			
			canvasResize();
		} else if (mouseCoordX===screenwidth-2) {
			addRightColumn();
			canvasResize();
		} 
		if (mouseCoordY===-1) {
			addTopRow();
			canvasResize();
		} else if (mouseCoordY===screenheight-2-editorRowCount) {
			addBottomRow();
			canvasResize();
		}
	}
}

function levelEditorRightClick(event,click) {
	if (mouseCoordY===-2) {
		if (mouseCoordX<=glyphImages.length) {
			glyphSelectedIndex=mouseCoordX;
			redraw();
		}
	} else if (mouseCoordX>-1&&mouseCoordY>-1&&mouseCoordX<screenwidth-2&&mouseCoordY<screenheight-2-editorRowCount	) {
		var coordIndex = mouseCoordY + mouseCoordX*level.height;
		var glyphmask = new BitVec(STRIDE_OBJ);
		glyphmask.ibitset(state.backgroundid);
		level.setCell(coordIndex, glyphmask);
		redraw();
	}
	else if (click) {
		if (mouseCoordX===-1) {
			//add a left row to the map
			removeLeftColumn();			
			canvasResize();
		} else if (mouseCoordX===screenwidth-2) {
			removeRightColumn();
			canvasResize();
		} 
		if (mouseCoordY===-1) {
			removeTopRow();
			canvasResize();
		} else if (mouseCoordY===screenheight-2-editorRowCount) {
			removeBottomRow();
			canvasResize();
		}
	}
}

function getTilesTraversingPoints(x1, y1, x2, y2) {
	
	
	if (cellwidth !== cellheight) {
		throw "Error: Cell is not square.";
	}
	
	var dirX = x2-x1;
	var dirY = y2-y1;
	//var rootedX = (y1*dirX)/dirY;					non-integer
	var scaledRootedX = (y1*dirX);						// == rootedX *dirY
	var rootedY = y1;
	
	// (x1/dirX)*dirY - y1 = c
	//	x*dirY = y*dirX
	
	//var shiftMid = x1-rootedX;					non-integer
	var scaledShiftMid = x1*dirY-scaledRootedX;			// == shiftMid*dirY
	
	// dirY*x2 - dirX*y2 - dirY*shiftMid	==	0
	// dirY*x2 - dirX*y2	==	scaledShiftMid
	
	//var horizontalDeviation = cellwidth*(1 + Math.abs(dirX/dirY))/2;		non-integer; formula provided by phenomist, checked by me (ThatScar)
	var scaledAbsDeviationTimesTwo = cellwidth*(Math.abs(dirX) + Math.abs(dirY));	// == abs(horizontalDeviation*dirY*2)
	
	//var scaledShiftMin = scaledShiftMid - horizontalDeviation*dirY;
	//var scaledShiftMax = scaledShiftMid + horizontalDeviation*dirY;
	var scaledShiftATimesTwo = 2*scaledShiftMid - scaledAbsDeviationTimesTwo;
	var scaledShiftBTimesTwo = 2*scaledShiftMid + scaledAbsDeviationTimesTwo;
	
	/// Important: shifts A and B must be used interchangeably
	
	// Testing against various cellCenterX, cellCenterY;
	// dirY*shiftMin		<	dirY*cellCenterX - dirX*cellCenterY	<=	dirY*shiftMax
	// scaledShiftMin		<	dirY*cellCenterX - dirX*cellCenterY	<=	scaledShiftMax
	// scaledShiftBTimesTwo	<2*(dirY*cellCenterX - dirX*cellCenterY)<=	scaledShiftBTimesTwo
	// OR if both A and B fail, instead.
	
	
	//fOfPoint = dirY*cellCenterX - dirX*cellCenterY;
	//isInside = (scaledShiftMin < fOfPoint) == (fOfPoint <= scaledShiftMax);
	function isInside(cellCenterXTimesTwo, cellCenterYTimesTwo) {
		fOfPointTimesTwo = dirY*cellCenterXTimesTwo - dirX*cellCenterYTimesTwo;
		return (scaledShiftATimesTwo < fOfPointTimesTwo) == (fOfPointTimesTwo <= scaledShiftBTimesTwo);
		/// Important: shifts A and B must be used interchangeably
	}
	
	var cellX1=Math.floor(x1/cellwidth);
	var cellY1=Math.floor(y1/cellheight);
	var cellX2=Math.floor(x2/cellwidth);
	var cellY2=Math.floor(y2/cellheight);
	var offsetToCenterTimesTwo = cellwidth-1;
	
	var xSign = (cellX2-cellX1)>=0 ? 1 : -1;
	var ySign = (cellY2-cellY1)>=0 ? 1 : -1;
	
	var yTrimmer = cellY1;
	
	var tileListX = [];
	var tileListY = [];
	
	
	for (var i=cellX1; i != cellX2+xSign; i += xSign) {
		var over = false;
		
		for (var j=yTrimmer; j != cellY2+ySign; j += ySign) {
			if (j >= level.height || j < 0 || i >= level.width || i < 0) {
				error = "Mouse input loop failed; it:" + i + " " + j + " cell1:" + cellX1 + " " + cellY1 + " cell2:" + cellX2 + " " + cellY2;
				console.log(error);
				throw error;
			}
			if (isInside(i*2*cellwidth+offsetToCenterTimesTwo, j*2*cellwidth+offsetToCenterTimesTwo)){
				
				tileListX.push(i);
				tileListY.push(j);
				// console.log(i + " " + j + " w:" + level.width + " h:" + level.height);
				
				over = true;
				yTrimmer = j;
			} else if (over) {
				break;
			}
		}
	}
	
	var avoidObstacles = "mouse_obstacle" in state.metadata;
	
	var otherTileListX = [cellX1];
	var otherTileListY = [cellY1];
	
	while(cellX1 !== cellX2 || cellY1 !== cellY2) {
		if (cellY1 >= level.height || cellY1 < 0 || cellX1 >= level.width || cellX1 < 0) {
			error = "Mouse input loop failed; cell1:" + cellX1 + " " + cellY1 + " cell2:" + cellX2 + " " + cellY2;
			console.log(error);
			throw error;
		}
		
		hitObstacle = function () {
			var coordIndex = screenOffsetY+cellY1 + (screenOffsetX+cellX1)*level.height;
			var tile = level.getCell(coordIndex);
			if (state.obstacleMask.anyBitsInCommon(tile)) {
				return true;
			} else {
				return false;
			}
		}
		
		cellCornerXTimesTwo = (cellX1*2)*cellwidth+offsetToCenterTimesTwo + xSign*cellwidth;
		cellCornerYTimesTwo = (cellY1*2)*cellwidth+offsetToCenterTimesTwo + ySign*cellwidth;
		fOfPointTimesTwo = dirY*cellCornerXTimesTwo - dirX*cellCornerYTimesTwo;
		if ((fOfPointTimesTwo > scaledShiftMid*2 == ySign > 0) != (xSign > 0)) {
			cellX1 += xSign;
			if (avoidObstacles && hitObstacle()) {
				cellX1 -= xSign;
				cellY1 += ySign;
			}
		} else {
			cellY1 += ySign;
			if (avoidObstacles && hitObstacle()) {
				cellY1 -= ySign;
				cellX1 += xSign;
			}
		}
		
		if (!(avoidObstacles && hitObstacle())) {
			otherTileListX.push(cellX1);
			otherTileListY.push(cellY1);
		} else {
			break;
		}
	}
			
	if (avoidObstacles) {
		tileListX = otherTileListX;
		tileListY = otherTileListY;
	} else for (var i=0; i<tileListX.length; i++) {
		if (tileListX[i] !== otherTileListX[i] || tileListY[i] !== otherTileListY[i]) {
			try {displayError("line tile placement algorithm discrepancies detected");} catch(e){}
			consolePrint("line tile placement algorithm discrepancies detected", true);
			throw "line tile placement algorithm discrepancies detected";
		}
	}
	
	return {tileListX: tileListX, tileListY: tileListY};
}

var lastCoord;

var x1 = 5;
var y1 = 5;
var x2 = 5;
var y2 = 5;

function mouseAction(event,click,id) {
	
	if (textMode) {
		if (!click) {
			if (quittingTitleScreen) {return;}

			if (!mouseInCanvas || mouseCoordY < 0 || mouseCoordY > 12) {
				hoverSelection = -1;
			} else {
				hoverSelection = mouseCoordY;
			}
			return;
		}

		if (event.type != "mousedown" && event.type != "touchstart") {
			return;
		}

		if (titleScreen) {
			if (quittingTitleScreen || titleSelected) {
				return;
			}

			if (titleMode===0) { //Title no save data
				titleButtonSelected();
			} else if (titleMode===1) {//Title with save data
				if (mouseCoordY===5 && titleSelectOptions >= 1) {
					titleSelection=0;
					titleButtonSelected();
				} else if (mouseCoordY===6 && titleSelectOptions >= 3) {
					titleSelection=1;
					titleButtonSelected();
				}
				else if (mouseCoordY===7 && titleSelectOptions >= 2) {
					if (titleSelectOptions === 2) {
						titleSelection = 1;
					} else {
						titleSelection = 2;
					}
					titleButtonSelected();
				} 
				else if (mouseCoordY===8 && titleSelectOptions >= 4) {
					titleSelection=3;
					titleButtonSelected();
				}
			} else if (titleMode===2) { //Level select
				if (quittingTitleScreen || titleSelected) {
					return;
				}
				//console.log(mouseCoordY);
				if (mouseCoordY===0) {
					titleSelection = 0;
				
					goToTitleScreen();

					tryPlayTitleSound();
					canvasResize();
				} else if (mouseCoordY===2) {
					if (levelSelectScrollPos != 0) {
						levelSelectScroll(-3)
					}
				} else if (mouseCoordY===12) {
					if (titleSelectOptions - amountOfLevelsOnScreen > levelSelectScrollPos) {
						levelSelectScroll(3)
					}
				} else {
					var clickedLevel = -1;
					switch (mouseCoordY) {
						case 3: clickedLevel = 0; break;
						case 4: clickedLevel = 1; break;
						case 5: clickedLevel = 2; break;
						case 6: clickedLevel = 3; break;
						case 7: clickedLevel = 4; break;
						case 8: clickedLevel = 5; break;
						case 9: clickedLevel = 6; break;
						case 10: clickedLevel = 7; break;
						case 11: clickedLevel = 8; break;
					}
					if (clickedLevel != -1) {
						clickedLevel += levelSelectScrollPos;
						if (clickedLevel < titleSelectOptions) {
							//console.log("Clicked level "+clickedLevel);
							titleSelection = clickedLevel;

							titleSelected=true;
							messageselected=false;
							timer=0;
							quittingTitleScreen=true;
							
							generateLevelSelectScreen();
						}
					}
				}
			}
		} else if (messageselected===false && (state.levels[curlevel].message !== undefined || messagetext != "")) {
			messageselected=true;
			timer=0;
			quittingMessageScreen=true;
			tryPlayCloseMessageSound();
			titleScreen=false;
			drawMessageScreen();
		}
	} else {
		if (winning) {return;}

		x1 = x2;
		y1 = y2;
		x2 = mousePixelX;
		y2 = mousePixelY;

		// clamp mouse target pixel (for moving)
		x2 = Math.max(0, Math.min(cellwidth*screenwidth-1, mousePixelX));
		y2 = Math.max(0, Math.min(cellheight*screenheight-1, mousePixelY));
		
		if (!click) {
			var tileLists = getTilesTraversingPoints(x1, y1, x2, y2);
			var tileListX = tileLists.tileListX;
			var tileListY = tileLists.tileListY;
			
			for (var i=0; i<tileListX.length; i++) {
				
				var coordIndex = screenOffsetY+tileListY[i] + (screenOffsetX+tileListX[i])*level.height;
				if (lastCoord===coordIndex) {
					continue;
				}
				lastCoord = coordIndex;
				
				if (againing) {
					//consolePrint("no mouse, againing",false);
				} else {
					try {
						var bak = backupLevel();
						var cell = level.getCell(coordIndex);
						cell.ibitset(id);
						level.setCell(coordIndex, cell);
						var inputdir = 5;
						pushInput(inputdir);
						if (processInput(inputdir,false,false,bak)) {
							redraw();
						}
					} catch(e) {
						console.log(e);
						consolePrint(e,true);
					}
				}
			}
		} else if (mouseCoordX>=0 && mouseCoordY>=0 && mouseCoordX<screenwidth && mouseCoordY<screenheight) {
			var coordIndex = screenOffsetY+mouseCoordY + (screenOffsetX+mouseCoordX)*level.height;
			
			lastCoord = coordIndex;
			if (againing) {
				//consolePrint("no mouse, againing",false);
			} else {
				try {
					var bak = backupLevel();
					var cell = level.getCell(coordIndex);
					cell.ibitset(id);
					level.setCell(coordIndex, cell);
					var inputdir = 5;
					pushInput(inputdir);
					if (processInput(inputdir,false,false,bak)) {
						redraw();
					}
				} catch(e) {
					console.log(e);
					consolePrint(e,true);
				}
			}
		}
	}
}

var anyEditsSinceMouseDown = false;

function onMouseDown(event, wasFiredByTouch = false) {

	if (event.handled){
		return;
	}

	ULBS();
	
	var lmb = event.button===0;
	var rmb = event.button===2 ;
	if (event.type=="touchstart"){
		lmb=true;
	}
	if (lmb && (event.ctrlKey||event.metaKey)){
		lmb=false;
		rmb=true;
	}
	
	if (lmb ) {
        lastDownTarget = event.target;
        keybuffer=[];
        if (event.target===canvas || event.target.className==="tapFocusIndicator") {
        	setMouseCoord(event);
        	dragging=true;
        	rightdragging=false;
        	anyEditsSinceMouseDown=false;
        	if (levelEditorOpened && !textMode) {
        		return levelEditorClick(event,true);
        	} else if ("mouse_left" in state.metadata) {
				if (wasFiredByTouch) {
					prevent(event)
				}
				return mouseAction(event,true,state.lmbID);		// must break to not execute dragging=false;
			}
        }
        dragging=false;
        rightdragging=false; 
    } else if (rmb) {
    	if (event.target.id==="gameCanvas") {
			setMouseCoord(event);
		    dragging=false;
		    rightdragging=true;
        	if (levelEditorOpened) {
        		return levelEditorRightClick(event,true);
        	} else if ("mouse_right" in state.metadata) {
				return mouseAction(event,true,state.rmbID);
			}
        } else {
			dragging=false;
			rightdragging=false;
		}
    } else if (event.button===1) {
		//undo
		if (textMode===false && (IsMouseGameInputEnabled() || levelEditorOpened)) {
			pushInput("undo");
			DoUndo(false,true);
			canvasResize(); // calls redraw
			return prevent(event);
		}
	}
	event.handled=true;

}

function rightClickCanvas(event) {
    if ("mouse_right" in state.metadata) {
		return prevent(event);
	}
	if (levelEditorOpened) {
		return prevent(event);
	}
}

function onMouseUp(event, wasFiredByTouch = false) {
	if (event.handled){
		return;
	}

	dragging=false;
    rightdragging=false;

	var lmb = event.button===0;
	var rmb = event.button===2;
	if (event.type=="touchend"){
		lmb=true;
	}

	if (lmb) {
        if (event.target===canvas) {
        	setMouseCoord(event);
        	if ("mouse_up" in state.metadata) {
				if (wasFiredByTouch) {
					prevent(event)
				} //Prevent "ghost click" on mobile
				return mouseAction(event,true,state.lmbupID);
			}
        }
    } else if (rmb) {
    	if (event.target.id==="gameCanvas") {
        	setMouseCoord(event);
        	if ("mouse_rup" in state.metadata) {
				return mouseAction(event,true,state.rmbupID);
			}
        }
    }
	event.handled=true;
}

function onKeyDown(event) {

	ULBS();
	
    event = event || window.event;

	// Prevent arrows/space from scrolling page
	if ((!IDE) && ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1)) {
		if (event&&(event.ctrlKey || event.metaKey)){
		} else {
			prevent(event);
		}
	}

	if ((!IDE) && event.keyCode===77){//m
		toggleMute();		
	}

	
    if (keybuffer.indexOf(event.keyCode)>=0) {
    	return;
    }

    if(lastDownTarget === canvas || (window.Mobile && (lastDownTarget === window.Mobile.focusIndicator) ) ){
    	if (keybuffer.indexOf(event.keyCode)===-1) {
    		if (event&&(event.ctrlKey || event.metaKey)){
		    } else {
    		    keybuffer.splice(keyRepeatIndex,0,event.keyCode);
	    	    keyRepeatTimer=0;
	    	    checkKey(event,!event.repeat);
		    }
		}
	}


    if (canDump===true) {
        if (event.keyCode===74 && (event.ctrlKey||event.metaKey)) {//ctrl+j
            dumpTestCase();
            prevent(event);
        } else if (event.keyCode===75 && (event.ctrlKey||event.metaKey)) {//ctrl+k
            makeGIF();
            prevent(event);
        }  else if (event.keyCode===83 && (event.ctrlKey||event.metaKey)) {//ctrl+s
            saveClick();
            prevent(event);
        }  else if (event.keyCode===66 && (event.ctrlKey||event.metaKey)) {//ctrl+b
            rebuildClick();
            prevent(event);
            event.target.blur();
            canvas.focus();
        }  else if (event.keyCode===82 && (event.ctrlKey||event.metaKey)) {//ctrl+r
            runClick();
            prevent(event);
            event.target.blur();
            canvas.focus();
        }  else if (event.keyCode===120) { //f9
            prevent(event);
        	solve();
        }  else if (event.keyCode===119) { //f8
            prevent(event);
        	stopSolving();
        } else if (event.keyCode===13 && (event.ctrlKey||event.metaKey)){//ctrl+enter
			canvas.focus();
			editor.display.input.blur();
			if (event.shiftKey){
				runClick();
			} else {
				rebuildClick();
			}
			prevent(event);
		}
	}
}

function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

	if (event.touches!=null && event.touches.length >= 1){
		canvasX = event.touches[0].pageX - totalOffsetX;
		canvasY = event.touches[0].pageY - totalOffsetY;
	} else if (event.changedTouches != null && event.changedTouches.length >= 1) {
		canvasX = event.changedTouches[0].pageX - totalOffsetX;
		canvasY = event.changedTouches[0].pageY - totalOffsetY;
	} else {
		canvasX = event.pageX - totalOffsetX;
		canvasY = event.pageY - totalOffsetY;
	}

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

function onKeyUp(event) {
	event = event || window.event;
	var index=keybuffer.indexOf(event.keyCode);
	if (index>=0){
    	keybuffer.splice(index,1);
    	if (keyRepeatIndex>=index){
    		keyRepeatIndex--;
    	}
    }
}

function onMyFocus(event) {	
	keybuffer=[];
	keyRepeatIndex = 0;
	keyRepeatTimer = 0;
}

function onMyBlur(event) {
	keybuffer=[];
	keyRepeatIndex = 0;
	keyRepeatTimer = 0;
}

var mouseCoordX=0;
var mouseCoordY=0;
var mousePixelX=0;
var mousePixelY=0;

function setMouseCoord(e){
	var coords = canvas.relMouseCoords(e);
	if (isNaN(coords.x) || isNaN(coords.y)) {
		console.warn("[SetMouseCoord] Did not recieve valid mouse coords from event. Ignoring it (since I'm assuming this is a faked keypress that was generated on mobile).")
	}
    mousePixelX=coords.x-xoffset;
	mousePixelY=coords.y-yoffset;
	mouseCoordX=Math.floor(mousePixelX/cellwidth);
	mouseCoordY=Math.floor(mousePixelY/cellheight);
}

function mouseMove(event) {
	
	if (event.handled){
		return;
	}

    if (levelEditorOpened) {
    	setMouseCoord(event);
    	if (dragging) { 	
    		levelEditorClick(event,false);
    	} else if (rightdragging){
    		levelEditorRightClick(event,false);
    	}
	    redraw();
	} else if (titleScreen && IsMouseGameInputEnabled()) {
		var prevHoverSelection = hoverSelection;
		setMouseCoord(event);
		mouseAction(event,false,null);
		if (prevHoverSelection != hoverSelection) {
			if (titleMode == 1) {
				generateTitleScreen();
				redraw();
			} else if (titleMode == 2) {
				generateLevelSelectScreen();
				redraw();
			}
		}
	} else if (dragging && "mouse_drag" in state.metadata) {
    	setMouseCoord(event);
    	mouseAction(event,false,state.dragID);
	    redraw();
	} else if (rightdragging && "mouse_rdrag" in state.metadata) {
    	setMouseCoord(event);
		mouseAction(event,false,state.rdragID);
	    redraw();
	}

	event.handled=true;
    //window.console.log("showcoord ("+ canvas.width+","+canvas.height+") ("+x+","+y+")");
}

let mouseInCanvas = false;

function onMouseIn() {
	mouseInCanvas = true;
	//console.log("Cursor moved into canvas")
}

function onMouseOut() {
	mouseInCanvas = false;
	//console.log("Cursor moved out of canvas")
}

document.addEventListener('touchstart', onTouchDown, {passive: false});
document.addEventListener('touchmove', mouseMove, false);
document.addEventListener('touchend', onTouchUp, {passive: false});

function onTouchDown(event) {
	onMouseDown(event, true)
}

function onTouchUp(event) {
	onMouseUp(event, true)
}

document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mouseup', onMouseUp, false);
document.addEventListener('mousemove', mouseMove, false);

document.addEventListener('contextmenu', rightClickCanvas, false);
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);
document.addEventListener('wheel', onMouseWheel, {passive: false})
window.addEventListener('focus', onMyFocus, false);
window.addEventListener('blur', onMyBlur, false);
canvas.addEventListener('mouseenter', onMouseIn, false);
canvas.addEventListener('mouseleave', onMouseOut, false)

function onMouseWheel(event) {

	if (!mouseInCanvas || event.ctrlKey) {return;}

	//console.log("Scroll "+event.deltaY);
	normalizedDelta = Math.sign(event.deltaY);

	if (titleScreen && titleMode == 2 && (IsMouseGameInputEnabled())) {
		levelSelectScroll(normalizedDelta);

		redraw();
		prevent(event)
	}
	if (levelEditorOpened) {
		glyphSelectedIndex = clamp(glyphSelectedIndex + normalizedDelta, 0, glyphCount() - 1);
		redraw();
		prevent(event)
	}
}

function levelSelectScroll(direction) {
	levelSelectScrollPos = clamp(levelSelectScrollPos + direction, 0, Math.max(state.sections.length - amountOfLevelsOnScreen, 0));
	titleSelection = clamp(titleSelection + direction, 0, state.sections.length - 1);
	//console.log(levelSelectScrollPos + " " + titleSelection);
	generateLevelSelectScreen();
}

function clamp(number, min, max) {
	return Math.min(Math.max(number, min), max);
}

function prevent(e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.stopPropagation) e.stopPropagation();
    e.returnValue=false;
    return false;
}

function titleButtonSelected() {
	if (titleSelected===false) {
		tryPlayStartGameSound();
		titleSelected=true;
		messageselected=false;
		timer=0;
		quittingTitleScreen=true;
		generateTitleScreen();
		canvasResize();

		document.dispatchEvent(new Event("psplusGameStarted"));
	}
}

var gamepadKeys = []; // used to store keys held at previous frame

function pollGamepads() {
	function buttonCheck(buttons, i) {
		if(buttons.length < i) {
			return false;
		}
		
		if(typeof(buttons[i]) == "object") {
			return buttons[i].pressed;
		}
	
		return buttons[i] == 1.0;
	}
	function axisCheck(axes, i, dir) {
		if(axes.length < i) {
			return false;
		}
		
		return axes[i] * dir > 0.5;
	}

	var newGamepadKeys = [];

	function keyPressed(keycode) {
    	if(keybuffer.indexOf(keycode) === -1) {
    		keybuffer.splice(keyRepeatIndex, 0, keycode);
	    	keyRepeatTimer = 0;
	    	checkKey({keyCode: keycode}, true);
		}

		newGamepadKeys.splice(0, 0, keycode);
	}

	// clear any keys previously pressed but no longer held:
	function clear() {
		for(var k = 0; k < gamepadKeys.length; k++) {
			if(newGamepadKeys.indexOf(gamepadKeys[k]) >= 0) {
				continue;
			}

			var index = keybuffer.indexOf(gamepadKeys[k]);
			if(index >= 0) {
				keybuffer.splice(index, 1);
				if(keyRepeatIndex >= index) {
					keyRepeatIndex--;
				}
			}
		}

		gamepadKeys = newGamepadKeys;
	}

	var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
	if(gamepads == null || gamepads.length == 0) {
		clear();
		return;
	}

	for(var i = 0; i < gamepads.length; i++) {
		var gamepad = gamepads[i];
		
		if(gamepad == null || !gamepad.connected) {
			continue;
		}

		if(buttonCheck(gamepad.buttons, 3) // Y
			|| buttonCheck(gamepad.buttons, 4)) { // LB
			
			keyPressed(82); // restart
		}
		if(buttonCheck(gamepad.buttons, 1) // B
			|| axisCheck(gamepad.axes, 2, 1)) { // LT
			
			keyPressed(90); // undo
		}
		if(buttonCheck(gamepad.buttons, 2) // X
			|| buttonCheck(gamepad.buttons, 0) // A
			|| buttonCheck(gamepad.buttons, 5) // RB
			|| axisCheck(gamepad.axes, 1, 1)) { // RT
			
			keyPressed(88); // action
		}
		if(buttonCheck(gamepad.buttons, 7)) { // menu button
			keyPressed(27); // exit
		}
		if(buttonCheck(gamepad.buttons, 6)) { // change view button
			keyPressed(69); // edit
		}
		if(axisCheck(gamepad.axes, 0, 1) // right
			|| axisCheck(gamepad.axes, 6, 1)) { // D-pad right
			
			keyPressed(39); // right
		}
		if(axisCheck(gamepad.axes, 0, -1) // left
			|| axisCheck(gamepad.axes, 6, -1)) { // D-pad left
			
			keyPressed(37); // left
		}
		if(axisCheck(gamepad.axes, 1, -1) // up
			|| axisCheck(gamepad.axes, 7, -1)) { // D-pad up
			
			keyPressed(38); // up
		}
		if(axisCheck(gamepad.axes, 1, 1) // down
			|| axisCheck(gamepad.axes, 7, 1)) { // D-pad down
			
			keyPressed(40); // down
		}
	}

	clear();
}

function checkKey(e,justPressed) {
	ULBS();
	
    if (winning) {
    	return;
	}
	if (e&&(e.ctrlKey || e.metaKey|| e.altKey)){
		return;
	}
	
    var inputdir=-1;
    switch(e.keyCode) {
        case 65://a
        case 37: //left
        {
//           window.console.log("LEFT");
            inputdir=1;
        break;
        }
        case 38: //up
        case 87: //w
        {
//            window.console.log("UP");
            inputdir=0;
        break;
        }
        case 68://d
        case 39: //right
        {
//            window.console.log("RIGHT");
            inputdir=3;
        break;
        }
        case 83://s
        case 40: //down
        {
//            window.console.log("DOWN");
            inputdir=2;
        break;
        }
        case 80://p
        {
			printLevel();
        	break;
        }
        case 13://enter
        case 32://space
        case 67://c
        case 88://x
        {
//            window.console.log("ACTION");
			if (justPressed && ignoreNotJustPressedAction){
				ignoreNotJustPressedAction=false;
			}
			if (justPressed===false && ignoreNotJustPressedAction){
				return;
			}
			if (norepeat_action===false || justPressed) {
            	inputdir=4;
            } else {
            	return;
            }
        break;
        }
        case 85://u
        case 90://z
        {
            //undo
            if (textMode===false) {
                pushInput("undo");
                DoUndo(false,true);
                canvasResize(); // calls redraw
            	return prevent(e);
            }
            break;
        }
        case 82://r
        {
        	if (textMode===false) {
        		if (justPressed) {
	        		pushInput("restart");
	        		DoRestart();
	                canvasResize(); // calls redraw
            		return prevent(e);
            	}
            }
            break;
        }
        case 27://escape
        {
        	if(solving) {
        		stopSolving();
        		break;
        	}
        	if (titleScreen===false || titleMode > 1) {
				if ((timer/1000>0.5 || titleMode > 1) && !quittingTitleScreen) {

					titleSelection = 0;
					
					timer = 0;
					if(titleScreen === false && state.metadata["level_select"] !== undefined) {
						gotoLevelSelectScreen();
					} else {
						goToTitleScreen();
					}

					tryPlayTitleSound();
					canvasResize();
				}

				return prevent(e)
        	}
        	break;
        }
        case 69: {//e
        	if (!solving && canOpenEditor) {
        		if (justPressed) {
        			if (titleScreen){
        				if (state.title==="EMPTY GAME"){
        					compile(["loadFirstNonMessageLevel"]);
        				} else {
        					nextLevel();
        				}
        			}
        			levelEditorOpened=!levelEditorOpened;
        			if (levelEditorOpened===false){
        				printLevel();
        			}
        			restartTarget=backupLevel();
        			canvasResize();
        		}
        		return prevent(e);
        	}
            break;
		}
		case 48://0
		case 49://1
		case 50://2
		case 51://3
		case 52://4
		case 53://5
		case 54://6
		case 55://7
		case 56://8
		case 57://9
		{
        	if (levelEditorOpened&&justPressed) {
        		var num=9;
        		if (e.keyCode>=49)  {
        			num = e.keyCode-49;
        		}

				if (num<glyphImages.length) {
					glyphSelectedIndex=num;
				} else {
					consolePrint("Trying to select tile outside of range in level editor.",true)
				}

        		canvasResize();
        		return prevent(e);
        	}	
        	break;	
        }
		case 189://-
		{
        	if (levelEditorOpened&&justPressed) {
				if (glyphSelectedIndex>0) {
					glyphSelectedIndex--;
					canvasResize();
					return prevent(e);
				} 
        	}	
        	break;	
		}
		case 187://+
		{
        	if (levelEditorOpened&&justPressed) {
				if (glyphSelectedIndex+1<glyphImages.length) {
					glyphSelectedIndex++;
					canvasResize();
					return prevent(e);
				} 
        	}	
        	break;	
		}
    }
    if (throttle_movement && inputdir>=0&&inputdir<=3) {
    	if (lastinput==inputdir && input_throttle_timer<repeatinterval) {
    		return;
    	}else {
    		lastinput=inputdir;
    		input_throttle_timer=0;
    	}
    }
    if (textMode) {
		if(!throttle_movement) { //If movement isn't throttled, then throttle it anyway
			if (!titleScreen && lastinput==inputdir && input_throttle_timer < repeatinterval) { //Don't throttle on level select
				return;
			} else {
				lastinput=inputdir;
				input_throttle_timer=0;
			}
		}
		
    	if (state.levels.length===0) {
    		//do nothing
    	} else if (titleScreen) {
			if (isSitelocked()) {return;}
    		if (titleMode===0) {
    			if (inputdir===4&&justPressed) {
    				titleButtonSelected();
    			}
    		} else {
    			if (inputdir==4&&justPressed) {
    				if (titleSelected===false) {    				
						tryPlayStartGameSound();
	    				titleSelected=true;
	    				messageselected=false;
	    				timer=0;
	    				quittingTitleScreen=true;
						
						if(titleMode == 1) {
							generateTitleScreen();
							document.dispatchEvent(new Event("psplusGameStarted"));
						} else if(titleMode == 2) {
							generateLevelSelectScreen();
						}
	    				redraw();
	    			}
    			}
    			else if (inputdir===0||inputdir===2) {
					if (quittingTitleScreen || titleSelected) {
						return;
					}
					
    				if (inputdir===0){
    					titleSelection--;    					
    				} else {
    					titleSelection++;    					    					
					}

					if(titleSelection >= titleSelectOptions) {
						titleSelection -= titleSelectOptions;
					} else if (titleSelection < 0) {
						titleSelection += titleSelectOptions;
					}
					
					if(titleMode == 1) {
						generateTitleScreen();
					} else if(titleMode == 2) {
						generateLevelSelectScreen();
					}
    				redraw();
    			}
    		}
    	} else {
    		if (inputdir==4&&justPressed) {    				
				if (unitTesting) {
					nextLevel();
					return;
				} else if (messageselected===false) {
    				messageselected=true;
    				timer=0;
    				quittingMessageScreen=true;
    				tryPlayCloseMessageSound();
    				titleScreen=false;
    				drawMessageScreen();
    			}
    		}
    	}
    } else {
	    if (!againing && inputdir>=0) {
            if (inputdir===4 && ('noaction' in state.metadata)) {

            } else {
                pushInput(inputdir);
                if (processInput(inputdir)) {
                    redraw();
                }
	        }
	       	return prevent(e);
    	}
    }
}


function update() {
    var draw = false;

	timer+=deltatime;
	tweentimer+=deltatime;
	input_throttle_timer+=deltatime;

    if (quittingTitleScreen) {
        if (timer/1000>0.3) {
			quittingTitleScreen=false;
			
			if(titleMode <= 1) {
				nextLevel();
			} else if(titleMode == 2) {
				gotoLevel(titleSelection);
			}
        }
    }
    if (againing) {
        if (timer>againinterval&&messagetext.length==0) {
            if (processInput(-1)) {
                draw = true;
                keyRepeatTimer=0;
                autotick=0;
            }
        }
    }
    if (quittingMessageScreen) {
        if (timer/1000>0.15) {
            quittingMessageScreen=false;
            if (messagetext==="") {
            	nextLevel();
            } else {
            	messagetext="";
            	textMode=false;
				titleScreen=false;
				titleMode=(curlevel>0||curlevelTarget!==null)?1:0;
				titleSelected=false;
				ignoreNotJustPressedAction=true;
				titleSelection=0;
    			canvasResize();  
    			checkWin();          	
            }
        }
    }
    if (winning) {
        if (timer/1000>0.5) {
            winning=false;
            nextLevel();
        }
	}
	
	pollGamepads();

    if (keybuffer.length>0) {
	    keyRepeatTimer+=deltatime;
	    var ticklength = throttle_movement ? repeatinterval : repeatinterval/(Math.sqrt(keybuffer.length));
	    if (keyRepeatTimer>ticklength) {
	    	keyRepeatTimer=0;	
	    	keyRepeatIndex = (keyRepeatIndex+1)%keybuffer.length;
	    	var key = keybuffer[keyRepeatIndex];
	        checkKey({keyCode:key},false);
	    }
	}

    if (autotickinterval>0&&!textMode&&!levelEditorOpened&&!againing&&!winning) {
        autotick+=deltatime;
        if (autotick>autotickinterval) {
            autotick=0;
            pushInput("tick");
            if (processInput(-1)) {
                draw = true;
            }
        }
    }

	if (draw || (typeof state !== "undefined" && 
		(state.metadata.smoothscreen !== undefined || state.metadata.tween_length !== undefined))) {
      redraw();
	}
}

var looping=false;
// Lights, camera…function!
var loop = function(){
	looping=true;
	try {
		update();
	}
	catch (e) {
		//Something went wrong, but it's more important that the loop doesn't crash during errors
		console.error(e);
	}
	if (document.visibilityState==='hidden'){
		looping=false;
		return;
	};
	setTimeout(loop,deltatime);
}

document.addEventListener('visibilitychange', function logData() {
	if (document.visibilityState === 'visible') {
		if (looping===false){
			loop();
		}
	}
  });

loop();
// @@end js/inputoutput.js


// @@begin js/console.js
function jumpToLine(i) {

    var code = parent.form1.code;

    var editor = code.editorreference;

    // editor.getLineHandle does not help as it does not return the reference of line.
    var ll = editor.doc.lastLine();
    var low=i-1-10;    
    var high=i-1+10;    
    var mid=i-1;
    if (low<0){
    	low=0;
    }
    if (high>ll){
    	high=ll;
    }
    if (mid>ll){
    	mid=ll;
    }

    editor.scrollIntoView(low);
    editor.scrollIntoView(high);
    editor.scrollIntoView(mid);
    editor.setCursor(mid, 0);
}

var consolecache = [];


function consolePrintFromRule(text,rule,urgent) {

	if (urgent===undefined) {
		urgent=false;
	}


	var ruleDirection = dirMaskName[rule.direction];

	var logString = '<font color="green">Rule <a onclick="jumpToLine(' + rule.lineNumber + ');"  href="javascript:void(0);">' + 
			rule.lineNumber + '</a> ' + ruleDirection + " : "  + text + '</font>';

	if (cache_console_messages&&urgent==false) {		
		consolecache.push([logString,null,null,1]);
	} else {
		addToConsole(logString);
	}
}

function consolePrint(text,urgent,linenumber,inspect_ID) {

	if (urgent===undefined) {
		urgent=false;
	}


	if (cache_console_messages && urgent===false) {		
		consolecache.push([text,linenumber,inspect_ID,1]);
	} else {
		consoleCacheDump();
		addToConsole(text);
	}
}


var cache_n = 0;

function addToConsole(text) {
	let cache = document.createElement("div");
	cache.id = "cache" + cache_n;
	cache.innerHTML = text;
	cache_n++;
	
	var code = document.getElementById('consoletextarea');
	code.appendChild(cache);
	consolecache=[];
	var objDiv = document.getElementById('lowerarea');
	objDiv.scrollTop = objDiv.scrollHeight;
}

function consoleCacheDump() {
	if (cache_console_messages===false) {
		return;
	}
	
	//pass 1 : aggregate identical messages
	for (var i = 0; i < consolecache.length-1; i++) {
		var this_row = consolecache[i];
		var this_row_text=this_row[0];

		var next_row = consolecache[i+1];
		var next_row_text=next_row[0];

		if (this_row_text===next_row_text){			
			consolecache.splice(i,1);
			i--;
			//need to preserve visual_id from later one
			next_row[3]=this_row[3]+1;
		}
	}

	var batched_messages=[];
	var current_batch_row=[];
	//pass 2 : group by debug visibility
	for (var i=0;i<consolecache.length;i++){
		var row = consolecache[i];

		var message = row[0];
		var lineNumber = row[1];
		var inspector_ID = row[2];
		var count = row[3];
		
		if (i===0||lineNumber==null){
			current_batch_row=[lineNumber,inspector_ID,[row]]; 
			batched_messages.push(current_batch_row);
			continue;
		} 

		var batch_lineNumber = current_batch_row[0];
		var batch_inspector_ID = current_batch_row[1];

		if (inspector_ID===null && lineNumber==batch_lineNumber){
			current_batch_row[2].push(row);
		} else {
			current_batch_row=[lineNumber,inspector_ID,[row]]; 
			batched_messages.push(current_batch_row);
		}
	}

	var summarised_message = "<br>";
	for (var j=0;j<batched_messages.length;j++){
		var batch_row = batched_messages[j];
		var batch_lineNumber = batch_row[0];
		var inspector_ID = batch_row[1];
		var batch_messages = batch_row[2];
		
		summarised_message+="<br>"

		if (inspector_ID!= null){
			summarised_message+=`<span class="hoverpreview" onmouseover="debugPreview(${inspector_ID})" onmouseleave="debugUnpreview()">`;
		}
		for (var i = 0; i < batch_messages.length; i++) {

			if(i>0){
				summarised_message+=`<br><span class="noeye_indent"></span>`
			}
			var curdata = batch_messages[i];
			var curline = curdata[0];
			var times_repeated = curdata[3];
			if (times_repeated>1){
				curline += ` (x${times_repeated})`;
			}
			summarised_message += curline
		}

		if (inspector_ID!= null){
			summarised_message+=`</span>`;
		}
	}


	addToConsole(summarised_message);
}

function consoleError(text) {	
        var errorString = '<span class="errorText">' + text + '</span>';
        consolePrint(errorString,true);
}
function clearConsole() {
	var code = document.getElementById('consoletextarea');
	code.innerHTML = '';
	var objDiv = document.getElementById('lowerarea');
	objDiv.scrollTop = objDiv.scrollHeight;
		
	//clear up debug stuff.
	debugger_turnIndex=0;
	debug_visualisation_array=[];
	diffToVisualize=null;
}

var clearConsoleClick = document.getElementById("clearConsoleClick");
clearConsoleClick.addEventListener("click", clearConsole, false);
clearConsoleClick.addEventListener("click", clearConsole, false);
function verboseToggle() {
	if (!titleScreen) {
		var verboseOn = !verbose_logging
	verbose_logging = verboseOn;
	cache_console_messages = verboseOn;
	consolePrint("Verbose logging is now " + (verbose_logging ? "ENABLED" : "DISABLED"), true);
	} else {
		consolePrint("Once your game is running, you can use this button to toggle Verbose Logging", true);
	}
}

var verboseLoggingClick = document.getElementById("verboseLoggingClick");
verboseLoggingClick.addEventListener("click", verboseToggle, false);
verboseLoggingClick.addEventListener("click", verboseToggle, false);

// @@end js/console.js


// @@begin js/buildStandalone.js
var get_blob = function() {
		return self.Blob;
}

var standalone_HTML_String="";

var clientStandaloneRequest = new XMLHttpRequest();

clientStandaloneRequest.open('GET', 'standalone_inlined.txt');
clientStandaloneRequest.onreadystatechange = function() {

		if(clientStandaloneRequest.readyState!=4) {
			return;
		}
		if (clientStandaloneRequest.responseText==="") {
			consolePrint("Couldn't find standalone template. Is there a connection problem to the internet?",true,null,null);
		}
		standalone_HTML_String=clientStandaloneRequest.responseText;
}
clientStandaloneRequest.send();

function buildStandalone(sourceCode) {
	if (standalone_HTML_String.length===0) {
		consolePrint("Can't export yet - still downloading html template.",true,null,null);
		return;
	}

	var htmlString = standalone_HTML_String.concat("");
	var title = "PuzzleScript Game";
	if (state.metadata.title!==undefined) {
		title=state.metadata.title;
	}
	var homepage = "auroriax.github.io/PuzzleScript";
	if (state.metadata.homepage!==undefined) {
		homepage=state.metadata.homepage;
		if (!homepage.match(/^https?:\/\//)) {
			homepage = "https://" + homepage;
		}
	}
	var homepage_stripped = homepage.replace(/^https?:\/\//,'');

	if ('background_color' in state.metadata) {
		htmlString = htmlString.replace(/black;\/\*Don\'t/g,state.bgcolor+';\/\*Don\'t');	
	}
	if ('text_color' in state.metadata) {
		htmlString = htmlString.replace(/lightblue;\/\*Don\'t/g,state.fgcolor+';\/\*Don\'t');	
	}

	htmlString = htmlString.replace(/__GAMETITLE__/g,title);


	htmlString = htmlString.replace(/__HOMEPAGE__/g,homepage);
	htmlString = htmlString.replace(/__HOMEPAGE_STRIPPED_PROTOCOL__/g,homepage_stripped);

	// $ has special meaning to JavaScript's String.replace ($0, $1, etc.) Escape $ as $$.
	sourceCode = sourceCode.replace(/\$/g, '$$$$');

	htmlString = htmlString.replace(/__GAMEDAT__/g,sourceCode);

	savePlainTextFile(htmlString, title+'.html')
}

// @@end js/buildStandalone.js


// @@begin js/engine.js
var onLevelRestarted = new Event("levelRestarted");

var RandomGen = new RNG();

var intro_template = [
  "..................................",
  "..................................",
  "..................................",
  "......Puzzle Script Terminal......",
  "..............v 1.7+..............",
  "..................................",
  "..................................",
  "..................................",
  ".........insert cartridge.........",
  "................................. ",
  "................................  ",
  "...............................   ",
  "..............................    "
];

var sitelock_template = [
	"..................................",
	"..................................",
	"..................................",
	"......Puzzle Script Terminal......",
	"..............v 1.7+..............",
	"..................................",
	"..................................",
	"..................................",
	".....This game is sitelocked!.....",
	"................................. ",
	"................................  ",
	"...............................   ",
	"..............................    "
  ];

var messagecontainer_template = [
  "..................................",
  "..................................",
  "..................................",
  "..................................",
  "..................................",
  "..................................",
  "..................................",
  "..................................",
  "..................................",
  "..................................",
  "..........X to continue...........",
  "..................................",
  ".................................."
];

var messagecontainer_template_mouse = [
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"........Click to continue.........",
	"..................................",
	".................................."
];

var titletemplate_firstgo = [
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..........#.start game.#..........",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	".................................."];

var titletemplate_firstgo_selected = [
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"###########.start game.###########",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	".................................."];
	
var titletemplate_empty = [
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	"..................................",
	".................................."];

var title_options = [[
	".............continue.............",
	"...........#.continue.#...........",
	"############.continue.############",
	"...........>.continue.<...........",
], [
	"...........level select...........",
	".........#.level select.#.........",
	"##########.level select.##########",
	".........>.level select.<..........",
], [
	".............settings.............",
	"...........#.settings.#...........",
	"############.settings.############",
	"...........>.settings.<...........",
], [
	".............new game.............",
	"...........#.new game.#...........",
	"############.new game.############",
	"...........>.new game.<...........",
],];

var MENUITEM_CONTINUE = 0;
var MENUITEM_LEVELSELECT = 1;
var MENUITEM_SETTINGS = 2;
var MENUITEM_NEWGAME = 3;

var MENUITEMVERSION_IDLE = 0;
var MENUITEMVERSION_HIGHLIGHTED = 1;
var MENUITEMVERSION_SELECTED = 2;
var MENUITEMVERSION_HOVERED = 3;

var titleImage=[];
var titleWidth=titletemplate_empty[0].length;
var titleHeight=titletemplate_empty.length;
var textMode=true;
var titleScreen=true;
var titleMode=0;//1 means title screen with options, 2 means level select
var titleSelection=0;
var titleSelectOptions=2;
var titleAvailableOptions = [];
var titleSelected=false;
var hoverSelection=-1; //When mouse controls are enabled, over which row the mouse is hovering. -1 when disabled.

function showContinueOptionOnTitleScreen(){
	if (state.metadata.level_select !== undefined) {
		return true;
	} else {
		return hasStartedTheGame();
	}
}

function hasStartedTheGame() {
	return (curlevel>0||curlevelTarget!==null)&&(curlevel in state.levels);
}

function hasSolvedAtLeastOneSection() {
	if (state.metadata.level_select !== undefined) {
		return solvedSections.length >= 1;
	} else {
		return false;
	}
}

function unloadGame() {
	state=introstate;
	level = new Level(0, 5, 5, 2, null, null);
	level.objects = new Int32Array(0);
	generateTitleScreen();
	canvasResize();
	redraw();
	titleSelected=true;
}

function isContinueOptionSelected() {
	if(state.metadata["continue_is_level_select"] !== undefined) {
		return false;
	}

	return titleAvailableOptions[titleSelection] == MENUITEM_CONTINUE;
}

function isNewGameOptionSelected() {
	if (titleMode == 0 || titleSelectOptions == 1 || titleAvailableOptions.length == 0) {
		//If there's only one option, assume it's the new game button
		return true;	
	}

	return titleAvailableOptions[titleSelection] == MENUITEM_NEWGAME;
}

function isLevelSelectOptionSelected() {
	if(state.metadata["level_select"] === undefined) {
		return false;
	}
	
	if(state.metadata["continue_is_level_select"] !== undefined) {
		//Act as if the "continue" button is the "level select" button
		if (titleAvailableOptions[titleSelection] == MENUITEM_CONTINUE) {
			return true;
		}
	}

	return titleAvailableOptions[titleSelection] == MENUITEM_LEVELSELECT;
}

function generateTitleScreen()
{
  tryLoadCustomFont();

	titleMode=showContinueOptionOnTitleScreen()?1:0;

	if (state.levels.length===0) {
		titleImage=intro_template;
		return;
  }

    if (isSitelocked()) {
		titleImage = sitelock_template;
		return;
	}

	var title = "PuzzleScript Game";
	if (state.metadata.title!==undefined) {
		title=state.metadata.title;
	}

	if (titleMode===0) {
        titleSelectOptions = 1;
		if (titleSelected) {
			titleImage = deepClone(titletemplate_firstgo_selected);		
		} else {
			titleImage = deepClone(titletemplate_firstgo);					
		}
	} else {

		var playedGameBefore = hasStartedTheGame() || hasSolvedAtLeastOneSection()

		titleAvailableOptions = [];

		if (playedGameBefore) {
			titleAvailableOptions.push(MENUITEM_CONTINUE);
		} else {
			titleAvailableOptions.push(MENUITEM_NEWGAME);
		}

		if(state.metadata["level_select"] !== undefined && (state.metadata["continue_is_level_select"] === undefined || !playedGameBefore)) {			
			titleAvailableOptions.push(MENUITEM_LEVELSELECT);
		}

		/*if(state.metadata["settings"] !== undefined) {
			titleAvailableOptions.push(2);
		}*/

		if (playedGameBefore) {
			titleAvailableOptions.push(MENUITEM_NEWGAME);
		}

		titleImage = deepClone(titletemplate_empty);

		titleSelectOptions = titleAvailableOptions.length;

		//Convert array to menu
		for(var i = 0; i < titleSelectOptions; i++) {
			var version = MENUITEMVERSION_IDLE;
			
			//If there are two items, add a gap of spacing between them
			var j = 0;
			if(titleSelectOptions == 2 && i == 1) {
				j = 1;
			}
			var lineInTitle = 5 + i + j;

			if(titleSelection == i) {
				if(titleSelected) {
					version = MENUITEMVERSION_SELECTED;
				} else {
					version = MENUITEMVERSION_HIGHLIGHTED;
				}
			}

			if (IsMouseGameInputEnabled() && hoverSelection == lineInTitle && !titleSelected && hoverSelection >= 0) {
				version = MENUITEMVERSION_HOVERED;
			}

			titleImage[lineInTitle] = deepClone(title_options[titleAvailableOptions[i]][version]);
		}
	}

	if (state.metadata.text_controls) {
		for (var i=0;i<titleImage.length;i++)
		{
			titleImage[i]=titleImage[i].replace(/\./g, ' ');
		}

		var customText = state.metadata.text_controls;
		var wrappedText = wordwrap(customText, 35, true);
		if (wrappedText[0]) {titleImage[10] = wrappedText[0]}
		if (wrappedText[1]) {titleImage[11] = wrappedText[1]}
		if (wrappedText[2]) {titleImage[12] = wrappedText[2]}
	} else {
		var noAction = 'noaction' in state.metadata;	
		var noUndo = 'noundo' in state.metadata;
		var noRestart = 'norestart' in state.metadata;

		titleImage[10] = ".arrow keys to move...............";

		if (noAction) {
			titleImage[11]=".X to select......................";
		} else {
			titleImage[11]=" X to action......................"
		}

		if (noUndo && noRestart) {
			titleImage[12]="..................................";
		} else if (noUndo) {
			titleImage[12]=".R to restart.....................";
		} else if (noRestart) {
			titleImage[12]=".Z to undo........................";
		} else {
			titleImage[12]=".Z to undo, R to restart..........";
		}

		if (IsMouseGameInputEnabled()) {
			titleImage[10]="..................................";
			titleImage[11]=".MOUSE to interact................";
			titleImage[12]=".MMB to undo, R to restart........";
		}
		for (var i=0;i<titleImage.length;i++)
		{
			titleImage[i]=titleImage[i].replace(/\./g, ' ');
		}
	}

	var width = titleImage[0].length;
	var titlelines=wordwrap(title,titleImage[0].length);
	if (state.metadata.author!==undefined){
		if ( titlelines.length>3){
			titlelines.splice(3);
			logWarning("Game title is too long to fit on screen, truncating to three lines.",undefined,true);
		}
	} else {
		if ( titlelines.length>5){
			titlelines.splice(5);
			logWarning("Game title is too long to fit on screen, truncating to five lines.",undefined,true);
		}

	}
	for (var i=0;i<titlelines.length;i++) {
		var titleline=titlelines[i];
		var titleLength=titleline.length;
		var lmargin = ((width-titleLength)/2)|0;
		var rmargin = width-titleLength-lmargin;
		var row = titleImage[1+i];
		titleImage[1+i]=row.slice(0,lmargin)+titleline+row.slice(lmargin+titleline.length);
	}
	if (state.metadata.author!==undefined) {
		var attribution="by "+state.metadata.author;
		var attributionsplit = wordwrap(attribution,titleImage[0].length);
		if (attributionsplit[0].length<titleImage[0].length){
			attributionsplit[0]=" "+attributionsplit[0];
		}
		if (attributionsplit.length>3){
			attributionsplit.splice(3);
			logWarning("Author list too long to fit on screen, truncating to three lines.",undefined,true);
		}
		for (var i=0;i<attributionsplit.length;i++) {
			var line = attributionsplit[i]+" ";
			if (line.length>width){
				line=line.slice(0,width);
			}
			var row = titleImage[3+i];
			titleImage[3+i]=row.slice(0,width-line.length)+line;
		}
	}

}

var levelSelectScrollPos = 0;

function gotoLevelSelectScreen() {
	if(state.metadata["level_select"] === undefined){
		goToTitleScreen();
		return;
	}
	levelSelectScrollPos = 0;
	titleSelected = false;
	timer = 0;
	quittingTitleScreen = false;
	quittingMessageScreen = false;
	messageselected = false;
	titleMode = 2;
	titleScreen = true;
	textMode = true;
    againing = false;
	messagetext = "";

	if (titleSelection == false) {
		for(var i = 0; i < state.sections.length; i++) {
			if(state.sections[i].firstLevel > curlevel) {
				titleSelection = Math.max(0,i-1);
				break;
			}
		}
  }
  
  state.metadata = deepClone(state.default_metadata);
  twiddleMetadataExtras();

	generateLevelSelectScreen();
	redraw();
}

function generateLevelSelectScreen() {
	/*
	"...........select level...........",
	"..................................",
	"[✓].#.Testy section maxxx long.#.O",
	".................................|",
	"[ ]...Unselected section.........|",
	".................................|",
	"[ ]...Another section............|",
	".................................|",
	"[ ]...Another section............|",
	".................................|",
	"[ ]...Another section............|",
	".................................|",
	"[ ]...Another section............|"
  */

	titleImage = [
		" [ ESC: Back ]                    ",
		"           Level Select           "
	];

	if (hoverSelection == 0) {
		titleImage[0] =	"[  ESC: Back  ]                   ";
	}

	amountOfLevelsOnScreen = 9;

	titleSelectOptions = state.sections.length;

	if(titleSelection < levelSelectScrollPos) { //Up
		levelSelectScrollPos = titleSelection;
	} else if(titleSelection >= levelSelectScrollPos + amountOfLevelsOnScreen) { //Down
		levelSelectScrollPos = titleSelection - amountOfLevelsOnScreen + 1;
	}

	var posOnScreen = titleSelection - levelSelectScrollPos;
	if (posOnScreen == 0) {
		levelSelectScrollPos = Math.max(0, levelSelectScrollPos - 1);
		//console.log("On first position");
	}

	if (posOnScreen == amountOfLevelsOnScreen-1) {
		levelSelectScrollPos = Math.min(state.sections.length-amountOfLevelsOnScreen, levelSelectScrollPos + 1);
		//console.log("On last position");
	}

	if (levelSelectScrollPos != 0) {
		if (hoverSelection == 2) {
			titleImage.push("                        [  PREV  ]");
		} else {
			titleImage.push("                         [ PREV ] ");
		}
	} else {
		titleImage.push("                                  ");
	}

	var unlockedUntil = -1;
	if(state.metadata["level_select_lock"] !== undefined) {
		// find last solved section:
		var unsolvedSections = 0;
		for(var i = 0; i < state.sections.length; i++) {
			if(solvedSections.indexOf(state.sections[i].name) >= 0) {
				unlockedUntil = i;
			} else {
				unsolvedSections++;
			}
		}

		if(state.metadata.level_select_unlocked_ahead !== undefined) {
			unlockedUntil += Number(state.metadata.level_select_unlocked_ahead);
		} else if (state.metadata.level_select_unlocked_rollover !== undefined) {
			unlockedUntil = solvedSections.length + Number(state.metadata.level_select_unlocked_rollover) - 1;
		}
		else {
			unlockedUntil += 1;
		}

		//console.log("total: " + state.sections.length + "unsolved: " + unsolvedSections + " until:" + unlockedUntil)
	}
	//console.log(unlockedUntil);

	for(var i = levelSelectScrollPos; i < levelSelectScrollPos + amountOfLevelsOnScreen; i++) {
		if(i < 0 || i >= state.sections.length) {
			break;
		}

		var section = state.sections[i];
		var solved = (solvedSections.indexOf(section.name) >= 0);
		var selected = (i == titleSelection);
		var locked = (unlockedUntil >= 0 && i > unlockedUntil);

		var name = section.name.substring(0, 24);
		
		if(locked) {
			if(selected && titleSelected) {
				titleSelected = false;
				quittingTitleScreen = false;
			}

			var l = name.length;
			name = "";
			for(var j = 0; j < l; j++) {
				name += "*";
			}
		}
		
		var solved_symbol = "✓";
		if(state.metadata.level_select_solve_symbol !== undefined) {
			solved_symbol = state.metadata.level_select_solve_symbol;
		}
		var line = (solved ? solved_symbol : " ") + " ";

		var hover_symbol = " ";
		if (selected) {hover_symbol = "#"}
		if (IsMouseGameInputEnabled() && hoverSelection - 3 + levelSelectScrollPos == i) {hover_symbol = ">"}
		
		line += hover_symbol + " " + name;
		for(var j = name.length; j < 25; j++) {
			if(selected && titleSelected && j != name.length) {
				line += "#";
			} else {
				line += " ";
			}
		}
		line += (selected ? "#" : " ") + "  ";

		titleImage.push(line);
	}

	if (levelSelectScrollPos != titleSelectOptions - amountOfLevelsOnScreen && titleSelectOptions - amountOfLevelsOnScreen > 0) {
		if (hoverSelection == 12) {
			titleImage.push("                        [  NEXT  ]")
		} else {
			titleImage.push("                         [ NEXT ] ")
		}
	} else {
		titleImage.push("                                  ");
	}

	for(var i = titleImage.length; i < 13; i++) {
		titleImage.push("                                  ");
	}

	redraw();
}

function gotoLevel(sectionIndex) {
  if (solving) {
    return;
  }

  if (sectionIndex < 0) {return;} //Invalid index

  //console.log(sectionIndex);

	againing = false;
	messagetext = "";

	curlevel = state.sections[sectionIndex].firstLevel;

	loadLevelFromStateOrTarget();

	updateLocalStorage();
	resetFlickDat();
	canvasResize();	
	clearInputHistory();
}

var introstate = {
  title: "EMPTY GAME",
  attribution: "increpare",
    objectCount: 2,
    metadata:[],
    levels:[],
    bgcolor:"#000000",
    fgcolor:"#FFFFFF"
};

var state = introstate;

function deepClone(item) {
    if (!item) { return item; } // null, undefined values check

    var types = [ Number, String, Boolean ], 
        result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function(type) {
        if (item instanceof type) {
            result = type( item );
        }
    });

    if (typeof result == "undefined") {
        if (Object.prototype.toString.call( item ) === "[object Array]") {
            result = [];
            item.forEach(function(child, index, array) { 
                result[index] = deepClone( child );
            });
        } else if (typeof item == "object") {
            // testing that this is DOM
            if (item.nodeType && typeof item.cloneNode == "function") {
                var result = item.cloneNode( true );    
            } else if (!item.prototype) { // check that this is a literal
                if (item instanceof Date) {
                    result = new Date(item);
                } else {
                    // it is an object literal
                    result = {};
                    for (var i in item) {
                        result[i] = deepClone( item[i] );
                    }
                }
            } else {
                // depending what you would like here,
                // just keep the reference, or create new object
/*                if (false && item.constructor) {
                    // would not advice to do that, reason? Read below
                    result = new item.constructor();
                } else */{
                    result = item;
                }
            }
        } else {
            result = item;
        }
    }

    return result;
}

function wordwrap( str, width, handleNewlines = false ) {
 
    width = width || 75;
    var cut = true;
 
	if (!str) { return str; }
	
	//console.log("Before: "+str)
 
	var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');

	if (!handleNewlines) {
	
		return str.match( RegExp(regex, 'g') );
	} else {
		splitNewlines = str.split("\\n");
		var splitString  = [];
	
		splitNewlines.forEach(splitStr => {
			splitString = splitString.concat(splitStr.match( RegExp(regex, 'g') ));
		}) 
		
		//console.log(splitString);
		return splitString;
	}
 
}

var splitMessage=[];

function drawMessageScreen() {
	tryLoadCustomFont();

	titleMode=0;
	textMode=true;
	if ("text_message_continue" in state.metadata) {
		titleImage = deepClone(messagecontainer_template);

		for (var i=0;i<titleImage.length;i++)
		{
			titleImage[i]=titleImage[i].replace(/\./g, ' ');
		}

		titleImage[10] = state.metadata.text_message_continue;
	} else {
		if (IsMouseGameInputEnabled())
			titleImage = deepClone(messagecontainer_template_mouse);
		else
			titleImage = deepClone(messagecontainer_template);

		for (var i=0;i<titleImage.length;i++)
		{
			titleImage[i]=titleImage[i].replace(/\./g, ' ');
		}
	}

	var emptyLineStr = titleImage[9];
	var xToContinueStr = titleImage[10];

	titleImage[10]=emptyLineStr;

	var width = titleImage[0].length;

	var message;
	if (messagetext==="") {
		var leveldat = state.levels[curlevel];
		message = leveldat.message.trim();
	} else {
		message = messagetext;
	}
	
	splitMessage = wordwrap(message,titleImage[0].length, true);


	var offset = 5-((splitMessage.length/2)|0);
	if (offset<0){
		offset=0;
	}

	var count = Math.min(splitMessage.length,12);
	for (var i=0;i<count;i++) {
		if (!splitMessage[i]) {continue;}
		var m = splitMessage[i].trimRight();
		var row = offset+i;	
		var messageLength=m.length;
		var lmargin = ((width-messageLength)/2)|0;
		if (state.metadata.message_text_align) {
			var align = state.metadata.message_text_align.toLowerCase();
			if (align == "left") {
				lmargin = 0;
			} else if (align == "right") {
				lmargin = (width-messageLength);
			}
		}
		//var rmargin = width-messageLength-lmargin;
		var rowtext = titleImage[row];
		titleImage[row]=rowtext.slice(0,lmargin)+m+rowtext.slice(lmargin+m.length);		
	}

	var endPos = 10;
	if (count>=10) {
		if (count<12){
			endPos = count + 1;
		} else {
			endPos = 12;
		}
        }
  if (quittingMessageScreen) {
    titleImage[endPos]=emptyLineStr;
  } else {
    titleImage[endPos]=xToContinueStr;
  }
  
  canvasResize();
}

var loadedLevelSeed=0;

function loadLevelFromLevelDat(state,leveldat,randomseed,clearinputhistory) {	
	if (randomseed==null) {
		randomseed = (Math.random() + Date.now()).toString();
	}
	loadedLevelSeed = randomseed;
	RandomGen = new RNG(loadedLevelSeed);
	forceRegenImages=true;
	ignoreNotJustPressedAction=true;
	titleScreen=false;
	titleMode=showContinueOptionOnTitleScreen()?1:0;
	titleSelection=0;
  titleSelected=false;
  dragging = false;
  rightdragging = false;
  state.metadata = deepClone(state.default_metadata);
    againing=false;
    if (leveldat===undefined) {
    	consolePrint("Trying to access a level that doesn't exist.",true);
		goToTitleScreen();
    	return;
    }
    if (leveldat.message !== undefined) {
      // This "level" is actually a message.
      ignoreNotJustPressedAction=true;
	  tryPlayShowMessageSound();
	  twiddleMetadataExtras();
      drawMessageScreen();
      canvasResize();
      clearInputHistory();
    } else if (leveldat.target !== undefined) {
      // This "level" is actually a goto.
      //tryPlayGotoSound();
      setSectionSolved(state.levels[Number(curlevel)].section)
      gotoLevel(leveldat.target);
    } else {
      titleMode=0;
      textMode=false;
    level = leveldat.clone();
    RebuildLevelArrays();
        if (state!==undefined) {
	        if (state.metadata.flickscreen!==undefined){
	            oldflickscreendat=[
	            	0,
	            	0,
	            	Math.min(state.metadata.flickscreen[0],level.width),
	            	Math.min(state.metadata.flickscreen[1],level.height)
	            ];
	        } else if (state.metadata.zoomscreen!==undefined){
	            oldflickscreendat=[
	            	0,
	            	0,
	            	Math.min(state.metadata.zoomscreen[0],level.width),
	            	Math.min(state.metadata.zoomscreen[1],level.height)
	            ];
	        } else if (state.metadata.smoothscreen!==undefined){
	            oldflickscreendat=[
	            	0,
	            	0,
	            	Math.min(state.metadata.smoothscreen.screenSize.width,level.width),
	            	Math.min(state.metadata.smoothscreen.screenSize.height,level.height)
	            ];
	        }
        }

      initSmoothCamera();
      twiddleMetadataExtras();

	    backups=[]
	    restartTarget=backupLevel();
		keybuffer=[];

	    if ('run_rules_on_level_start' in state.metadata) {
			runrulesonlevelstart_phase=true;
			processInput(-1,true);
			runrulesonlevelstart_phase=false;
	    }
	}

	if (clearinputhistory===true){
		clearInputHistory();
	}
}

function loadLevelFromStateTarget(state,levelindex,target,randomseed) { 
    var leveldat = target;    
  curlevel=levelindex;
  curlevelTarget=target;
    if (leveldat.message===undefined) {
      if (levelindex=== 0){ 
      tryPlayStartLevelSound();
    } else {
      tryPlayStartLevelSound();     
    }
    }
    loadLevelFromLevelDat(state,state.levels[levelindex],randomseed);
    restoreLevel(target, true);
    restartTarget=target;
}

function loadLevelFromState(state,levelindex,randomseed) {  
    var leveldat = state.levels[levelindex];    
  curlevel=levelindex;
  curlevelTarget=null;
    if (leveldat!==undefined && leveldat.message===undefined) {
		document.dispatchEvent(new CustomEvent("psplusLevelLoaded", {detail: levelindex}));
      if (levelindex=== 0){ 
      tryPlayStartLevelSound();
    } else {
      tryPlayStartLevelSound();     
    }
	}

    loadLevelFromLevelDat(state,leveldat,randomseed);
}

var sprites = [
{
    color: '#423563',
    dat: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ]
},
{
    color: '#252342',
    dat: [
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 0]
    ]
}
];

let loadedCustomFont = false;

function tryLoadCustomFont() {
	if(state == null || state.metadata == null || state.metadata.custom_font == undefined || loadedCustomFont) {
		return;
	}

	var custom_font = new FontFace('PuzzleCustomFont', 'url('+state.metadata.custom_font+')');
	custom_font.load().then(function(loaded_face) {
		document.fonts.add(loaded_face);
		loadedCustomFont = true;
		canvasResize();
		redraw();
	}).catch(function(error) {alert("Unable to load font!");});
}

tryLoadCustomFont();

generateTitleScreen();
if (titleMode>0){
	titleSelection=0;
}

canvasResize();

function tryPlaySimpleSound(soundname) {
  if (state.sfx_Events[soundname]!==undefined) {
    var seed = state.sfx_Events[soundname];
    playSound(seed);
  }
}
function tryPlayTitleSound() {
  tryPlaySimpleSound("titlescreen");
}

function tryPlayStartGameSound() {
  tryPlaySimpleSound("startgame");
}

function tryPlayEndGameSound() {
  tryPlaySimpleSound("endgame");
}

function tryPlayCancelSound() {
  tryPlaySimpleSound("cancel");
}

function tryPlayStartLevelSound() {
  tryPlaySimpleSound("startlevel");
}

function tryPlayEndLevelSound() {
  tryPlaySimpleSound("endlevel");
}

function tryPlayUndoSound(){
  tryPlaySimpleSound("undo");
}

function tryPlayRestartSound(){
  tryPlaySimpleSound("restart");
}

function tryPlayShowMessageSound(){
  tryPlaySimpleSound("showmessage");
}

function tryPlayCloseMessageSound(){
  tryPlaySimpleSound("closemessage");
}

var backups=[];
var restartTarget;

function backupLevel() {
	var ret = {
		dat : new Int32Array(level.objects),
		width : level.width,
		height : level.height,
		oldflickscreendat: oldflickscreendat.concat([]),
    cameraPositionTarget: Object.assign({}, cameraPositionTarget)
	};
	if (state.metadata.runtime_metadata_twiddling !== undefined) {
      var metadata = deepClone(state.metadata)
      delete metadata.custom_font;
      ret.metadata = metadata;
    }
	return ret;
}

function level4Serialization() {
	var ret = {
		dat : Array.from(level.objects),
		width : level.width,
		height : level.height,
		oldflickscreendat: oldflickscreendat.concat([]),
    cameraPositionTarget: Object.assign({}, cameraPositionTarget)
	};
	return ret;
}


function tryDeactivateYoutube(){
  var youtubeFrame = document.getElementById("youtubeFrame");
  if (youtubeFrame){
    document.body.removeChild(youtubeFrame);
  }
}

function tryActivateYoutube(){
  var youtubeFrame = document.getElementById("youtubeFrame");
  if (youtubeFrame){
    return;
  }
  if (canYoutube) {
    if ('youtube' in state.metadata) {
      var youtubeid=state.metadata['youtube'];
      var url = "https://www.youtube.com/embed/"+youtubeid+"?autoplay=1&loop=1&playlist="+youtubeid;
      ifrm = document.createElement("IFRAME");
      ifrm.setAttribute("src",url);
      ifrm.setAttribute("id","youtubeFrame");
      ifrm.style.visibility="hidden";
      ifrm.style.width="500px";
      ifrm.style.height="500px";
      ifrm.style.position="absolute";
      ifrm.style.top="-1000px";
      ifrm.style.left="-1000px";
      document.body.appendChild(ifrm);
    }
  }
}

function setGameState(_state, command, randomseed) {
  oldflickscreendat=[];
  timer=0;
  autotick=0;
  winning=false;
  againing=false;
    messageselected=false;
    STRIDE_MOV=_state.STRIDE_MOV;
    STRIDE_OBJ=_state.STRIDE_OBJ;
    
    sfxCreateMask=new BitVec(STRIDE_OBJ);
    sfxDestroyMask=new BitVec(STRIDE_OBJ);

  if (command===undefined) {
    command=["restart"];
  }
  if ((state.levels.length===0 || _state.levels.length===0) && command.length>0 && command[0]==="rebuild")  {
    command=["restart"];
  }
  if (randomseed===undefined) {
    randomseed=null;
  }
  RandomGen = new RNG(randomseed);

  state = _state;

    if (command[0]!=="rebuild"){
      backups=[];
    }
    //set sprites
    sprites = [];
    for (var n in state.objects) {
        if (state.objects.hasOwnProperty(n)) {
            var object = state.objects[n];
            var sprite = {
                colors: object.colors,
                dat: object.spritematrix
            };
            sprites[object.id] = sprite;
        }
    }
    if (state.metadata.realtime_interval!==undefined) {
      autotick=0;
      autotickinterval=state.metadata.realtime_interval*1000;
    } else {
      autotick=0;
      autotickinterval=0;
    }

    if (state.metadata.key_repeat_interval!==undefined) {
    	repeatinterval=state.metadata.key_repeat_interval*1000;
    } else {
      repeatinterval=150;
	}
	
	if (state.metadata.tween_length!==undefined) {
		tweeninterval=state.metadata.tween_length*1000;
    } else {
		tweeninterval = 0;
    }

    if (state.metadata.again_interval!==undefined) {
    againinterval=state.metadata.again_interval*1000;
    } else {
      againinterval=150;
    }
    if (throttle_movement && autotickinterval===0) {
      logWarning("throttle_movement is designed for use in conjunction with realtime_interval. Using it in other situations makes games gross and unresponsive, broadly speaking.  Please don't.");
    }
    norepeat_action = state.metadata.norepeat_action!==undefined;
    
    switch(command[0]){
    	case "restart":
    	{
    		if (restarting==true){
    			logWarning('A "restart" command is being triggered in the "run_rules_on_level_start" section of level creation, which would cause an infinite loop if it was actually triggered, but it\'s being ignored, so it\'s not.');
    			break;
    		}
		    winning=false;
		    timer=0;
		    titleScreen=true;
		    tryPlayTitleSound();
		    textMode=true;
		    titleSelection=0;
		    titleSelected=false;
		    quittingMessageScreen=false;
		    quittingTitleScreen=false;
		    messageselected=false;
		    titleMode = 0;
		    if (showContinueOptionOnTitleScreen()) {
		    	titleMode=1;
		    }

			if (state.metadata.skip_title_screen!==undefined) {
				consolePrint("skip_title_screen enabled, proceeding to do exactly as it says on the tin.")
				if(state.metadata["continue_is_level_select"] !== undefined) {
					gotoLevelSelectScreen();
				}
				else if(titleMode <= 1) {
					nextLevel();
				} else if(titleMode == 2) {
					gotoLevel(titleSelection);
				}
			} else {
				generateTitleScreen();
			}

		    break;
		}
		case "rebuild":
		{
			//do nothing
			break;
		}
		case "loadFirstNonMessageLevel":{
			for (var i=0;i<state.levels.length;i++){
				if (state.levels[i].hasOwnProperty("message")){
					continue;
				}
				var targetLevel = i;
				curlevel=targetLevel;
				curlevelTarget=null;
			    winning=false;
			    timer=0;
			    titleScreen=false;
			    textMode=false;
			    //titleSelection=showContinueOptionOnTitleScreen()?1:0;
			    titleSelected=false;
			    quittingMessageScreen=false;
			    quittingTitleScreen=false;
			    messageselected=false;
			    titleMode = 0;
				loadLevelFromState(state,targetLevel,randomseed);
				break;
			}
			break;	
		}
		case "loadLevel":
		{
			var targetLevel = command[1];
			curlevel=targetLevel;
			curlevelTarget=null;
		    winning=false;
		    timer=0;
		    titleScreen=false;
		    textMode=false;
		    //titleSelection=showContinueOptionOnTitleScreen()?1:0;
		    titleSelected=false;
		    quittingMessageScreen=false;
		    quittingTitleScreen=false;
		    messageselected=false;
		    titleMode = 0;
			loadLevelFromState(state,targetLevel,randomseed);
			break;
		}
		case "levelline":
		{
			var targetLine = command[1];
			for (var i=state.levels.length-1;i>=0;i--) {
				var level= state.levels[i];
				if(level.lineNumber<=targetLine+1) {
					curlevel=i;
					curlevelTarget=null;
				    winning=false;
				    timer=0;
				    titleScreen=false;
				    textMode=false;
				    //titleSelection=showContinueOptionOnTitleScreen()?1:0;
				    titleSelected=false;
				    quittingMessageScreen=false;
				    quittingTitleScreen=false;
				    messageselected=false;
				    titleMode = 0;
					loadLevelFromState(state,i);
					break;
				}
			}
			break;
		}
	}

	if(command[0] !== "rebuild") {
		clearInputHistory();
	}
	canvasResize();

	if (state.sounds.length==0&&state.metadata.youtube==null){
		killAudioButton();
	} else {
		showAudioButton();
	}
}

function RebuildLevelArrays() {
  level.movements = new Int32Array(level.n_tiles * STRIDE_MOV);

    level.rigidMovementAppliedMask = [];
    level.rigidGroupIndexMask = [];
	level.rowCellContents = [];
	level.rowCellContents_Movements = [];
	level.colCellContents = [];
	level.colCellContents_Movements = [];
	level.mapCellContents = new BitVec(STRIDE_OBJ);
	level.mapCellContents_Movements = new BitVec(STRIDE_MOV);

	_movementVecs = [new BitVec(STRIDE_MOV),new BitVec(STRIDE_MOV),new BitVec(STRIDE_MOV)];

	_o1 = new BitVec(STRIDE_OBJ);
	_o2 = new BitVec(STRIDE_OBJ);
	_o2_5 = new BitVec(STRIDE_OBJ);
	_o3 = new BitVec(STRIDE_OBJ);
	_o4 = new BitVec(STRIDE_OBJ);
	_o5 = new BitVec(STRIDE_OBJ);
	_o6 = new BitVec(STRIDE_OBJ);
	_o7 = new BitVec(STRIDE_OBJ);
	_o8 = new BitVec(STRIDE_OBJ);
	_o9 = new BitVec(STRIDE_OBJ);
	_o10 = new BitVec(STRIDE_OBJ);
	_o11 = new BitVec(STRIDE_OBJ);
	_o12 = new BitVec(STRIDE_OBJ);
	_m1 = new BitVec(STRIDE_MOV);
	_m2 = new BitVec(STRIDE_MOV);
	_m3 = new BitVec(STRIDE_MOV);
	

    for (var i=0;i<level.height;i++) {
      level.rowCellContents[i]=new BitVec(STRIDE_OBJ);        
    }
    for (var i=0;i<level.width;i++) {
      level.colCellContents[i]=new BitVec(STRIDE_OBJ);        
    }

    for (var i=0;i<level.height;i++) {
    	level.rowCellContents_Movements[i]=new BitVec(STRIDE_MOV);	    	
    }
    for (var i=0;i<level.width;i++) {
    	level.colCellContents_Movements[i]=new BitVec(STRIDE_MOV);	    	
    }

    for (var i=0;i<level.n_tiles;i++)
    {
        level.rigidMovementAppliedMask[i]=new BitVec(STRIDE_MOV);
        level.rigidGroupIndexMask[i]=new BitVec(STRIDE_MOV);
    }
}

var messagetext="";
var currentMovedEntities = {};
var newMovedEntities = {};

function applyDiff(diff, level_objects) {

	var index=0;
	
	while (index<diff.dat.length){
		var start_index = diff.dat[index];
		var copy_length = diff.dat[index+1];
		if (copy_length===0){
			break;//tail of buffer is all 0s
		}
		for (j=0;j<copy_length;j++){
			level_objects[start_index+j]=diff.dat[index+2+j];
		}
		index += 2 + copy_length;
	}
}

function unconsolidateDiff(before,after) {

	// If before is not a diff, return it, otherwise generate a complete 'before' 
	// state from the 'after' state and the 'diff' (remember, the diffs are all 
	// backwards...).
	if (!before.hasOwnProperty("diff")) {
		return before;
	}

	var after_objects = new Int32Array(after.dat);
	applyDiff(before, after_objects);

	return {
		dat: after_objects,
		width: before.width,
		height: before.height,
		oldflickscreendat: before.oldflickscreendat
	}
}

function restoreLevel(lev, snapCamera, resetTween = true, resetAutoTick = true) {
	var diffing = lev.hasOwnProperty("diff");

	oldflickscreendat=lev.oldflickscreendat.concat([]);

	if (resetTween) {
		currentMovedEntities = {};
		//console.log("Wiped movedEntities (level)")
	}

	if (diffing){
		applyDiff(lev, level.objects);
	} else {	
		level.objects = new Int32Array(lev.dat);
	}

	if (level.width !== lev.width || level.height !== lev.height) {
		level.width = lev.width;
		level.height = lev.height;
		level.n_tiles = lev.width * lev.height;
		RebuildLevelArrays();
		//regenerate all other stride-related stuff
	}
	else 
	{
	// layercount doesn't change

		for (var i=0;i<level.n_tiles;i++) {
			level.movements[i]=0;
			level.rigidMovementAppliedMask[i]=0;
			level.rigidGroupIndexMask[i]=0;
		}	

	    for (var i=0;i<level.height;i++) {
	    	var rcc = level.rowCellContents[i];
	    	rcc.setZero();
	    }
	    for (var i=0;i<level.width;i++) {
	    	var ccc = level.colCellContents[i];
	    	ccc.setZero();
	    }
	}

    if (lev.cameraPositionTarget) {
      cameraPositionTarget = Object.assign({}, lev.cameraPositionTarget);

      if (snapCamera) {
        cameraPosition = Object.assign({}, cameraPositionTarget)
      }
    }
    
    if (state.metadata.runtime_metadata_twiddling !== undefined) {
		if (lev.metadata === undefined) {
			lev.metadata = deepClone(state.default_metadata);
			consolePrint("RUNTIME METADATA TWIDDLING: Reloaded level state that did not have saved metadata. "+
			"Likely this state was recovered from a CHECKPOINT. Using the default metadata instead.", true);
		}
	 state.metadata = deepClone(lev.metadata);
     twiddleMetadataExtras(resetAutoTick);
    }

    againing=false;
    level.commandQueue=[];
    level.commandQueueSourceRules=[];
}

var zoomscreen=false;
var flickscreen=false;
var smoothscreen=false;
var screenwidth=0;
var screenheight=0;

//compresses 'before' into diff
function consolidateDiff(before,after){
	if (before.width !== after.width || before.height!==after.height || before.dat.length!==after.dat.length){
		return before;
	}
	if (before.hasOwnProperty("diff")||after.hasOwnProperty("diff")){
		return before;
	}
	//only generate diffs if level size is bigger than this
	if (before.dat.length<1024){
		return before;
	}
	//diff structure: repeating ( start,length, [ data ] )
	var result = new Int32Array(128);
	var position=0;
	var chain=false;
	var chain_start_idx_in_diff=-1;
	var before_dat = before.dat;
	var after_dat = after.dat;
	for (var i=0;i<before_dat.length;i++){
		if (chain===false){
			if (before_dat[i]!==after_dat[i]){
				chain=true;
				chain_start_idx_in_diff = position;

				if (result.length<position+4){
					var doubled = new Int32Array(2*result.length);
					doubled.set(result);
					result = doubled;
				}

				result[position+0]=i;
				result[position+1]=1;
				result[position+2]=before_dat[i];
				position+=3;
			}
		} else {
			if (before_dat[i]!==after_dat[i]){
				
				if (position+1>=result.length){
					if (result.length<position+4){
						var doubled = new Int32Array(2*result.length);
						doubled.set(result);
						result = doubled;
					}	
				}
				result[chain_start_idx_in_diff+1]++;
				result[position]=before_dat[i];
				position++;
			} else {
				chain=false;
			}
		}
	}
	return {		
		diff : true,
		dat : result,
		width : before.width,
		height : before.height,
		oldflickscreendat: before.oldflickscreendat
	}
}

function addUndoState(state){
	backups.push(state);
	if(backups.length>2 && !backups[backups.length-1].hasOwnProperty("diff")){
		backups[backups.length-3]=consolidateDiff(backups[backups.length-3],backups[backups.length-2]);
	}
}

function DoRestart(force) {
	if (restarting===true){
		return;
	}
	if (force!==true && ('norestart' in state.metadata)) {
		return;
	}
	restarting=true;
	if (force!==true) {
		addUndoState(backupLevel());
	}

	if (verbose_logging) {
		consolePrint("--- restarting ---",true);
	}

	restoreLevel(restartTarget, true);
	tryPlayRestartSound();
	document.dispatchEvent(new CustomEvent("psplusLevelRestarted", {detail: curlevel}));

	if ('run_rules_on_level_start' in state.metadata) {
    	processInput(-1,true);
  }
  
  twiddleMetadataExtras();
	
	level.commandQueue=[];
	level.commandQueueSourceRules=[];
	restarting=false;
}

function backupDiffers(){
	if (backups.length==0){
		return true;
	}
	var bak = backups[backups.length-1];

	if (bak.hasOwnProperty("diff")){
		return bak.dat.length!==0 && bak.dat[1]!==0;//if it's empty or if it's all 0s
	} else {
		for (var i=0;i<level.objects.length;i++) {
			if (level.objects[i]!==bak.dat[i]) {
				return true;
			}
		}
		return false;
	}
}

function DoUndo(force,ignoreDuplicates, resetTween = true, resetAutoTick = true, forceSFX = false) {
  if ((!levelEditorOpened)&&('noundo' in state.metadata && force!==true)) {
    return;
  }
  if (verbose_logging) {
    consolePrint("--- undoing ---",true);
  }

  if (ignoreDuplicates){
    while (backupDiffers()==false){
      backups.pop();
    }
  }

  if (backups.length>0) {
    var torestore = backups[backups.length-1];
    restoreLevel(torestore, null, resetTween, resetAutoTick);
    backups = backups.splice(0,backups.length-1);
    if (! force || forceSFX) {
      tryPlayUndoSound();
    }
  }
}

function getPlayerPositions() {
    var result=[];
    var playerMask = state.playerMask;
    for (i=0;i<level.n_tiles;i++) {
        level.getCellInto(i,_o11);
        if (playerMask.anyBitsInCommon(_o11)) {
            result.push(i);
        }
    }
    return result;
}

function getLayersOfMask(cellMask) {
    var layers=[];
    for (var i=0;i<state.objectCount;i++) {
        if (cellMask.get(i)) {
            var n = state.idDict[i];
            var o = state.objects[n];
            layers.push(o.layer)
        }
    }
    return layers;
}

function moveEntitiesAtIndex(positionIndex, entityMask, dirMask) {
    var cellMask = level.getCell(positionIndex);
    cellMask.iand(entityMask);
    var layers = getLayersOfMask(cellMask);

    var movementMask = level.getMovements(positionIndex);
    for (var i=0;i<layers.length;i++) {
      movementMask.ishiftor(dirMask, 5 * layers[i]);
    }
    level.setMovements(positionIndex, movementMask);

	var colIndex=(positionIndex/level.height)|0;
	var rowIndex=(positionIndex%level.height);
	level.colCellContents_Movements[colIndex].ior(movementMask);
	level.rowCellContents_Movements[rowIndex].ior(movementMask);
	level.mapCellContents_Movements.ior(movementMask);
}


function startMovement(dir) {
  var movedany=false;
    var playerPositions = getPlayerPositions();
    for (var i=0;i<playerPositions.length;i++) {
        var playerPosIndex = playerPositions[i];
        moveEntitiesAtIndex(playerPosIndex,state.playerMask,dir);
    }
    return playerPositions;
}

var dirMasksDelta = {
     1:[0,-1],//up
     2:[0,1],//'down'  : 
     4:[-1,0],//'left'  : 
     8:[1,0],//'right' : 
     15:[0,0],//'?' : 
     16:[0,0],//'action' : 
     3:[0,0]//'no'
};

var dirMaskName = {
     1:'up',
     2:'down'  ,
     4:'left'  , 
     8:'right',  
     15:'?' ,
     16:'action',
     3:'no'
};

var seedsToPlay_CanMove=[];
var seedsToPlay_CantMove=[];

function repositionEntitiesOnLayer(positionIndex,layer,dirMask) 
{
    var delta = dirMasksDelta[dirMask];

    var dx = delta[0];
    var dy = delta[1];
    var tx = ((positionIndex/level.height)|0);
    var ty = ((positionIndex%level.height));
    var maxx = level.width-1;
    var maxy = level.height-1;

    if ( (tx===0&&dx<0) || (tx===maxx&&dx>0) || (ty===0&&dy<0) || (ty===maxy&&dy>0)) {
      return false;
    }

    var targetIndex = (positionIndex+delta[1]+delta[0]*level.height);

    var layerMask = state.layerMasks[layer];
    var targetMask = level.getCellInto(targetIndex,_o7);
	var sourceMask = level.getCellInto(positionIndex,_o8);

    if (layerMask.anyBitsInCommon(targetMask) && (dirMask!=16)) {
        return false;
    }

  for (var i=0;i<state.sfx_MovementMasks.length;i++) {
    var o = state.sfx_MovementMasks[i];
    var objectMask = o.objectMask;
    if (objectMask.anyBitsInCommon(sourceMask)) {
      var movementMask = level.getMovements(positionIndex);
      var directionMask = o.directionMask;
      if (movementMask.anyBitsInCommon(directionMask) && seedsToPlay_CanMove.indexOf(o.seed)===-1) {
        seedsToPlay_CanMove.push(o.seed);
      }
    }
  }

    var movingEntities = sourceMask.clone();
    sourceMask.iclear(layerMask);
    movingEntities.iand(layerMask);
    targetMask.ior(movingEntities);

    level.setCell(positionIndex, sourceMask);
	level.setCell(targetIndex, targetMask);
	
    var colIndex=(targetIndex/level.height)|0;
	var rowIndex=(targetIndex%level.height);
	
    level.colCellContents[colIndex].ior(movingEntities);
    level.rowCellContents[rowIndex].ior(movingEntities);
    level.mapCellContents.ior(movingEntities);
	//corresponding movement stuff in setmovements
    return true;
}

function repositionEntitiesAtCell(positionIndex) {
    var movementMask = level.getMovements(positionIndex);
    if (movementMask.iszero())
        return false;

    var moved=false;
    for (var layer=0;layer<level.layerCount;layer++) {
        var layerMovement = movementMask.getshiftor(0x1f, 5*layer);
        if (layerMovement!==0) {
            var thismoved = repositionEntitiesOnLayer(positionIndex,layer,layerMovement);
            if (thismoved) {
				if (state.metadata.tween_length) {
					var delta = dirMasksDelta[layerMovement];
					var targetIndex = (positionIndex+delta[1]+delta[0]*level.height);

					newMovedEntities["p"+targetIndex+"-l"+layer] = layerMovement;
				}

                movementMask.ishiftclear(layerMovement, 5*layer);
				moved = true;
            }
        }
    }

    level.setMovements(positionIndex, movementMask);

    return moved;
}


function Level(lineNumber, width, height, layerCount, objects, section) {
	this.lineNumber = lineNumber;
	this.width = width;
	this.height = height;
	this.n_tiles = width * height;
	this.objects = objects;
	this.section = section;
	this.layerCount = layerCount;
	this.commandQueue = [];
	this.commandQueueSourceRules = [];
}

Level.prototype.delta_index = function(direction)
{
	const [dx, dy] = dirMasksDelta[direction]
	return dx*this.height + dy
}

Level.prototype.clone = function() {
	var clone = new Level(this.lineNumber, this.width, this.height, this.layerCount, null, this.section);
	clone.objects = new Int32Array(this.objects);
	return clone;
}

Level.prototype.getCell = function(index) {
  return new BitVec(this.objects.subarray(index * STRIDE_OBJ, index * STRIDE_OBJ + STRIDE_OBJ));
}

Level.prototype.getCellInto = function(index,targetarray) {
  for (var i=0;i<STRIDE_OBJ;i++) {
    targetarray.data[i]=this.objects[index*STRIDE_OBJ+i]; 
  }
  return targetarray;
}

Level.prototype.setCell = function(index, vec) {
  for (var i = 0; i < vec.data.length; ++i) {
    this.objects[index * STRIDE_OBJ + i] = vec.data[i];
  }
}

var _movementVecs;
var _movementVecIndex=0;
Level.prototype.getMovements = function(index) {
  var _movementsVec=_movementVecs[_movementVecIndex];
  _movementVecIndex=(_movementVecIndex+1)%_movementVecs.length;

  for (var i=0;i<STRIDE_MOV;i++) {
    _movementsVec.data[i]=this.movements[index*STRIDE_MOV+i]; 
  }
  return _movementsVec;
}

Level.prototype.getMovementsInto = function(index,targetarray) {
	var _movementsVec=targetarray;

	for (var i=0;i<STRIDE_MOV;i++) {
		_movementsVec.data[i]=this.movements[index*STRIDE_MOV+i];	
	}
	return _movementsVec;
}

Level.prototype.setMovements = function(index, vec) {
	for (var i = 0; i < vec.data.length; ++i) {
		this.movements[index * STRIDE_MOV + i] = vec.data[i];
	}

	var targetIndex = index*STRIDE_MOV + i;
		
	//corresponding object stuff in repositionEntitiesOnLayer
	var colIndex=(index/this.height)|0;
	var rowIndex=(index%this.height);
	level.colCellContents_Movements[colIndex].ior(vec);
	level.rowCellContents_Movements[rowIndex].ior(vec);
	level.mapCellContents_Movements.ior(vec);


}

var ellipsisPattern = ['ellipsis'];

function BitVec(init) {
  this.data = new Int32Array(init);
  return this;
}

BitVec.prototype.cloneInto = function(target) {
  for (var i=0;i<this.data.length;++i) {
    target.data[i]=this.data[i];
  }
  return target;
}
BitVec.prototype.clone = function() {
  return new BitVec(this.data);
}

BitVec.prototype.iand = function(other) {
  for (var i = 0; i < this.data.length; ++i) {
    this.data[i] &= other.data[i];
  }
}


BitVec.prototype.inot = function() {
	for (var i = 0; i < this.data.length; ++i) {
		this.data[i] = ~this.data[i];
	}
}

BitVec.prototype.ior = function(other) {
  for (var i = 0; i < this.data.length; ++i) {
    this.data[i] |= other.data[i];
  }
}

BitVec.prototype.iclear = function(other) {
  for (var i = 0; i < this.data.length; ++i) {
    this.data[i] &= ~other.data[i];
  }
}

BitVec.prototype.ibitset = function(ind) {
  this.data[ind>>5] |= 1 << (ind & 31);
}

BitVec.prototype.ibitclear = function(ind) {
  this.data[ind>>5] &= ~(1 << (ind & 31));
}

BitVec.prototype.get = function(ind) {
  return (this.data[ind>>5] & 1 << (ind & 31)) !== 0;
}

BitVec.prototype.getshiftor = function(mask, shift) {
  var toshift = shift & 31;
  var ret = this.data[shift>>5] >>> (toshift);
  if (toshift) {
    ret |= this.data[(shift>>5)+1] << (32 - toshift);
  }
  return ret & mask;
}

BitVec.prototype.ishiftor = function(mask, shift) {
  var toshift = shift&31;
  var low = mask << toshift;
  this.data[shift>>5] |= low;
  if (toshift) {
    var high = mask >> (32 - toshift);
    this.data[(shift>>5)+1] |= high;
  }
}

BitVec.prototype.ishiftclear = function(mask, shift) {
  var toshift = shift & 31;
  var low = mask << toshift;
  this.data[shift>>5] &= ~low;
  if (toshift){
    var high = mask >> (32 - (shift & 31));
    this.data[(shift>>5)+1] &= ~high;
  }
}

BitVec.prototype.equals = function(other) {
  if (this.data.length !== other.data.length)
    return false;
  for (var i = 0; i < this.data.length; ++i) {
    if (this.data[i] !== other.data[i])
      return false;
  }
  return true;
}

BitVec.prototype.setZero = function() {
  for (var i = 0; i < this.data.length; ++i) {
    this.data[i]=0;
  }
}

BitVec.prototype.iszero = function() {
  for (var i = 0; i < this.data.length; ++i) {
    if (this.data[i])
      return false;
  }
  return true;
}

BitVec.prototype.bitsSetInArray = function(arr) {
  for (var i = 0; i < this.data.length; ++i) {
    if ((this.data[i] & arr[i]) !== this.data[i]) {
      return false;
    }
  }
  return true;
}

BitVec.prototype.bitsClearInArray = function(arr) {
  for (var i = 0; i < this.data.length; ++i) {
    if (this.data[i] & arr[i]) {
      return false;
    }
  }
  return true;
}

BitVec.prototype.anyBitsInCommon = function(other) {
  return !this.bitsClearInArray(other.data);
}

function Rule(rule) {
	this.direction = rule[0]; 		/* direction rule scans in */
	this.patterns = rule[1];		/* lists of CellPatterns to match */
	this.hasReplacements = rule[2];
	this.lineNumber = rule[3];		/* rule source for debugging */
	this.isEllipsis = rule[4];		/* true if pattern has ellipsis */
	this.groupNumber = rule[5];		/* execution group number of rule */
	this.isRigid = rule[6];
	this.commands = rule[7];		/* cancel, restart, sfx, etc */
	this.isRandom = rule[8];
	this.cellRowMasks = rule[9];
  this.cellRowMasks_Movements = rule[10];
  this.isGlobal = rule[11];
	this.ruleMask = this.cellRowMasks.reduce( (acc, m) => { acc.ior(m); return acc }, new BitVec(STRIDE_OBJ) );

	/*I tried out doing a ruleMask_movements as well along the lines of the above,
	but it didn't help at all - I guess because almost every tick there are movements 
	somewhere on the board - move filtering works well at a row/col level, but is pretty 
	useless (or worse than useless) on a boardwide level*/

	this.cellRowMatches = [];
	for (var i=0;i<this.patterns.length;i++) {
		this.cellRowMatches.push(this.generateCellRowMatchesFunction(this.patterns[i],this.isEllipsis[i]));
	}
	/* TODO: eliminate isRigid, groupNumber, isRandom
	from this class by moving them up into a RuleGroup class */
}


Rule.prototype.generateCellRowMatchesFunction = function(cellRow,hasEllipsis)  {
	if (hasEllipsis==false) {
		var cr_l = cellRow.length;

		/*
		hard substitute in the first one - if I substitute in all of them, firefox chokes.
		*/
		var fn = "";
		var mul = STRIDE_OBJ === 1 ? '' : '*'+STRIDE_OBJ;	
		for (var i = 0; i < STRIDE_OBJ; ++i) {
			fn += 'var cellObjects' + i + ' = objects[i' + mul + (i ? '+'+i: '') + '];\n';
		}
		mul = STRIDE_MOV === 1 ? '' : '*'+STRIDE_MOV;
		for (var i = 0; i < STRIDE_MOV; ++i) {
			fn += 'var cellMovements' + i + ' = movements[i' + mul + (i ? '+'+i: '') + '];\n';
		}
		fn += "return "+cellRow[0].generateMatchString('0_');// cellRow[0].matches(i)";
		for (var cellIndex=1;cellIndex<cr_l;cellIndex++) {
			fn+="&&cellRow["+cellIndex+"].matches(i+"+cellIndex+"*d, objects, movements)";
		}
		fn+=";";

		if (fn in matchCache) {
			return matchCache[fn];
		}
		//console.log(fn.replace(/\s+/g, ' '));
		return matchCache[fn] = new Function("cellRow","i", 'd', 'objects', 'movements',fn);
	} else {
		var cr_l = cellRow.length;

		var fn = "var result = [];\n"
		fn += "if(cellRow[0].matches(i, objects, movements)";
		var cellIndex=1;
		for (;cellRow[cellIndex]!==ellipsisPattern;cellIndex++) {
			fn+="&&cellRow["+cellIndex+"].matches(i+"+cellIndex+"*d, objects, movements)";
		}
		cellIndex++;
		fn+=") {\n";
		fn+="\tfor (var k=kmin;k<kmax;k++) {\n"
		fn+="\t\tif(cellRow["+cellIndex+"].matches((i+d*(k+"+(cellIndex-1)+")), objects, movements)";
		cellIndex++;
		for (;cellIndex<cr_l;cellIndex++) {
			fn+="&&cellRow["+cellIndex+"].matches((i+d*(k+"+(cellIndex-1)+")), objects, movements)";			
		}
		fn+="){\n";
		fn+="\t\t\tresult.push([i,k]);\n";
		fn+="\t\t}\n"
		fn+="\t}\n";				
		fn+="}\n";		
		fn+="return result;"


		if (fn in matchCache) {
			return matchCache[fn];
		}
		//console.log(fn.replace(/\s+/g, ' '));
		return matchCache[fn] = new Function("cellRow","i","kmax","kmin", 'd', "objects", "movements",fn);
	}
//say cellRow has length 3, with a split in the middle
/*
function cellRowMatchesWildcardFunctionGenerate(direction,cellRow,i, maxk, mink) {
  var result = [];
  var matchfirsthalf = cellRow[0].matches(i);
  if (matchfirsthalf) {
    for (var k=mink;k<maxk;k++) {
      if (cellRow[2].matches((i+d*(k+0)))) {
        result.push([i,k]);
      }
    }
  }
  return result;
}
*/
  

}


Rule.prototype.toJSON = function() {
	/* match construction order for easy deserialization */
	return [
		this.direction, this.patterns, this.hasReplacements, this.lineNumber, this.isEllipsis,
		this.groupNumber, this.isRigid, this.commands, this.isRandom, this.cellRowMasks,
		this.cellRowMasks_Movements
	];
};

var STRIDE_OBJ = 1;
var STRIDE_MOV = 1;

function CellPattern(row) {
  this.objectsPresent = row[0];
  this.objectsMissing = row[1];
  this.anyObjectsPresent = row[2];
  this.movementsPresent = row[3];
  this.movementsMissing = row[4];
  this.matches = this.generateMatchFunction();
  this.replacement = row[5];
};

function CellReplacement(row) {
  this.objectsClear = row[0];
  this.objectsSet = row[1];
  this.movementsClear = row[2];
  this.movementsSet = row[3];
  this.movementsLayerMask = row[4];
  this.randomEntityMask = row[5];
  this.randomDirMask = row[6];
};


var matchCache = {};



CellPattern.prototype.generateMatchString = function() {
  var fn = "(true";
  for (var i = 0; i < Math.max(STRIDE_OBJ, STRIDE_MOV); ++i) {
    var co = 'cellObjects' + i;
    var cm = 'cellMovements' + i;
    var op = this.objectsPresent.data[i];
    var om = this.objectsMissing.data[i];
    var mp = this.movementsPresent.data[i];
    var mm = this.movementsMissing.data[i];
    if (op) {
      if (op&(op-1))
        fn += '\t\t&& ((' + co + '&' + op + ')===' + op + ')\n';
      else
        fn += '\t\t&& (' + co + '&' + op + ')\n';
    }
    if (om)
      fn += '\t\t&& !(' + co + '&' + om + ')\n';
    if (mp) {
      if (mp&(mp-1))
        fn += '\t\t&& ((' + cm + '&' + mp + ')===' + mp + ')\n';
      else
        fn += '\t\t&& (' + cm + '&' + mp + ')\n';
    }
    if (mm)
      fn += '\t\t&& !(' + cm + '&' + mm + ')\n';
  }
  for (var j = 0; j < this.anyObjectsPresent.length; j++) {
    fn += "\t\t&& (0";
    for (var i = 0; i < STRIDE_OBJ; ++i) {
      var aop = this.anyObjectsPresent[j].data[i];
      if (aop)
        fn += "|(cellObjects" + i + "&" + aop + ")";
    }
    fn += ")";
  }
  fn += '\t)';
  return fn;
}

CellPattern.prototype.generateMatchFunction = function() {
	var i;
	var fn = '';
	var mul = STRIDE_OBJ === 1 ? '' : '*'+STRIDE_OBJ;	
	for (var i = 0; i < STRIDE_OBJ; ++i) {
		fn += '\tvar cellObjects' + i + ' = objects[i' + mul + (i ? '+'+i: '') + '];\n';
	}
	mul = STRIDE_MOV === 1 ? '' : '*'+STRIDE_MOV;
	for (var i = 0; i < STRIDE_MOV; ++i) {
		fn += '\tvar cellMovements' + i + ' = movements[i' + mul + (i ? '+'+i: '') + '];\n';
	}
	fn += "return " + this.generateMatchString()+';';
	if (fn in matchCache) {
		return matchCache[fn];
	}
	//console.log(fn.replace(/\s+/g, ' '));
	return matchCache[fn] = new Function("i", "objects", "movements", fn);
}

CellPattern.prototype.toJSON = function() {
  return [
    this.movementMask, this.cellMask, this.nonExistenceMask,
    this.moveNonExistenceMask, this.moveStationaryMask, this.randomDirOrEntityMask,
    this.movementsToRemove
  ];
};

var _o1,_o2,_o2_5,_o3,_o4,_o5,_o6,_o7,_o8,_o9,_o10,_o11,_o12;
var _m1,_m2,_m3;

CellPattern.prototype.replace = function(rule, currentIndex) {
  var replace = this.replacement;

  if (replace === null) {
    return false;
  }

  var replace_RandomEntityMask = replace.randomEntityMask;
  var replace_RandomDirMask = replace.randomDirMask;

  var objectsSet = replace.objectsSet.cloneInto(_o1);
  var objectsClear = replace.objectsClear.cloneInto(_o2);

  var movementsSet = replace.movementsSet.cloneInto(_m1);
  var movementsClear = replace.movementsClear.cloneInto(_m2);
  movementsClear.ior(replace.movementsLayerMask);

  if (!replace_RandomEntityMask.iszero()) {
    var choices=[];
    for (var i=0;i<32*STRIDE_OBJ;i++) {
      if (replace_RandomEntityMask.get(i)) {
        choices.push(i);
      }
    }
    var rand = choices[Math.floor(RandomGen.uniform() * choices.length)];
    var n = state.idDict[rand];
    var o = state.objects[n];
    objectsSet.ibitset(rand);
    objectsClear.ior(state.layerMasks[o.layer]);
    movementsClear.ishiftor(0x1f, 5 * o.layer);
  }
  if (!replace_RandomDirMask.iszero()) {
    for (var layerIndex=0;layerIndex<level.layerCount;layerIndex++){
      if (replace_RandomDirMask.get(5*layerIndex)) {
        var randomDir = Math.floor(RandomGen.uniform()*4);
        movementsSet.ibitset(randomDir + 5 * layerIndex);
      }
    }
  }
  
  var curCellMask = level.getCellInto(currentIndex,_o2_5);
  var curMovementMask = level.getMovements(currentIndex);

  var oldCellMask = curCellMask.cloneInto(_o3);
  var oldMovementMask = curMovementMask.cloneInto(_m3);

  curCellMask.iclear(objectsClear);
  curCellMask.ior(objectsSet);

  curMovementMask.iclear(movementsClear);
  curMovementMask.ior(movementsSet);

  var rigidchange=false;
  var curRigidGroupIndexMask =0;
  var curRigidMovementAppliedMask =0;
  if (rule.isRigid) {
    var rigidGroupIndex = state.groupNumber_to_RigidGroupIndex[rule.groupNumber];
    rigidGroupIndex++;//don't forget to -- it when decoding :O
    var rigidMask = new BitVec(STRIDE_MOV);
    for (var layer = 0; layer < level.layerCount; layer++) {
      rigidMask.ishiftor(rigidGroupIndex, layer * 5);
    }
    rigidMask.iand(replace.movementsLayerMask);
    curRigidGroupIndexMask = level.rigidGroupIndexMask[currentIndex] || new BitVec(STRIDE_MOV);
    curRigidMovementAppliedMask = level.rigidMovementAppliedMask[currentIndex] || new BitVec(STRIDE_MOV);

    if (!rigidMask.bitsSetInArray(curRigidGroupIndexMask.data) &&
      !replace.movementsLayerMask.bitsSetInArray(curRigidMovementAppliedMask.data) ) {
      curRigidGroupIndexMask.ior(rigidMask);
      curRigidMovementAppliedMask.ior(replace.movementsLayerMask);
      rigidchange=true;

    }
  }

  var result = false;

  //check if it's changed
  if (!oldCellMask.equals(curCellMask) || !oldMovementMask.equals(curMovementMask) || rigidchange) { 
    result=true;
    if (rigidchange) {
      level.rigidGroupIndexMask[currentIndex] = curRigidGroupIndexMask;
      level.rigidMovementAppliedMask[currentIndex] = curRigidMovementAppliedMask;
    }

		var created = curCellMask.cloneInto(_o4);
		created.iclear(oldCellMask);
		sfxCreateMask.ior(created);
		var destroyed = oldCellMask.cloneInto(_o5);
		destroyed.iclear(curCellMask);
		sfxDestroyMask.ior(destroyed);

		level.setCell(currentIndex, curCellMask);
		level.setMovements(currentIndex, curMovementMask);

		var colIndex=(currentIndex/level.height)|0;
		var rowIndex=(currentIndex%level.height);
		level.colCellContents[colIndex].ior(curCellMask);
		level.rowCellContents[rowIndex].ior(curCellMask);
		level.mapCellContents.ior(curCellMask);

		level.colCellContents_Movements[colIndex].ior(curMovementMask);
		level.rowCellContents_Movements[rowIndex].ior(curMovementMask);
		level.mapCellContents_Movements.ior(curMovementMask);

	}

  return result;
}


//say cellRow has length 5, with a split in the middle
/*
function cellRowMatchesWildcardFunctionGenerate(direction,cellRow,i, maxk, mink) {
  var result = [];
  var matchfirsthalf = cellRow[0].matches(i)&&cellRow[1].matches((i+d)%level.n_tiles);
  if (matchfirsthalf) {
    for (var k=mink,kmaxk;k++) {
      if (cellRow[2].matches((i+d*(k+0))%level.n_tiles)&&cellRow[2].matches((i+d*(k+1))%level.n_tiles)) {
        result.push([i,k]);
      }
    }
  }
  return result;
}
*/
/*
function DoesCellRowMatchWildCard(direction,cellRow,i,maxk,mink) {
  if (mink === undefined) {
    mink = 0;
  }

  var cellPattern = cellRow[0];

    //var result=[];

    if (cellPattern.matches(i)){
      var delta = dirMasksDelta[direction];
      var d0 = delta[0]*level.height;
    var d1 = delta[1];
        var targetIndex = i;

        for (var j=1;j<cellRow.length;j+=1) {
            targetIndex = (targetIndex+d1+d0);

            var cellPattern = cellRow[j]
            if (cellPattern === ellipsisPattern) {
              //BAM inner loop time
              for (var k=mink;k<maxk;k++) {
                var targetIndex2=targetIndex;
                    targetIndex2 = (targetIndex2+(d1+d0)*(k)+level.n_tiles)%level.n_tiles;
                for (var j2=j+1;j2<cellRow.length;j2++) {
                    cellPattern = cellRow[j2];
              if (!cellPattern.matches(targetIndex2)) {
                break;
              }
                        targetIndex2 = (targetIndex2+d1+d0);
                }

                if (j2>=cellRow.length) {
                  return true;
                    //result.push([i,k]);
                }
              }
              break;
            } else if (!cellPattern.matches(targetIndex)) {
        break;
            }
        }               
    }  
    return false;
}
*/
//say cellRow has length 3
/*
CellRow Matches can be specialized to look something like:
function cellRowMatchesFunctionGenerate(direction,cellRow,i) {
  var delta = dirMasksDelta[direction];
  var d = delta[1]+delta[0]*level.height;
  return cellRow[0].matches(i)&&cellRow[1].matches((i+d)%level.n_tiles)&&cellRow[2].matches((i+2*d)%level.n_tiles);
}
*/
/*
function DoesCellRowMatch(direction,cellRow,i,k) {
  var cellPattern = cellRow[0];
    if (cellPattern.matches(i)) {

      var delta = dirMasksDelta[direction];
      var d0 = delta[0]*level.height;
    var d1 = delta[1];
    var cr_l = cellRow.length;

        var targetIndex = i;
        for (var j=1;j<cr_l;j++) {
            targetIndex = (targetIndex+d1+d0);
            cellPattern = cellRow[j];
      if (cellPattern === ellipsisPattern) {
          //only for once off verifications
              targetIndex = (targetIndex+(d1+d0)*k);          
            }
        if (!cellPattern.matches(targetIndex)) {
                break;
            }
        }   
        
        if (j>=cellRow.length) {
            return true;
        }

    }  
    return false;
}
*/
function matchCellRow(direction, cellRowMatch, cellRow, cellRowMask,cellRowMask_Movements,d, isGlobal) {	
	var result=[];
	
	if ((!cellRowMask.bitsSetInArray(level.mapCellContents.data))||
	(!cellRowMask_Movements.bitsSetInArray(level.mapCellContents_Movements.data))) {
		return result;
	}

  if(isGlobal || state.metadata.local_radius === undefined){
    xmin=0;
    xmax=level.width;
    ymin=0;
    ymax=level.height;
  }
  else{
    var localradius = parseInt(state.metadata.local_radius);
    xmin=Math.max(0, (playerPositions[0]/level.height|0) - localradius);
    xmax=Math.min(level.width, (playerPositions[0]/level.height|0) + localradius +1);
    ymin=Math.max(0, playerPositions[0]%level.height - localradius);
    ymax=Math.min(level.height, playerPositions[0]%level.height + localradius+1);

  }

    var len=cellRow.length;

    switch(direction) {
      case 1://up
      {
        ymin+=(len-1);
        break;
      }
      case 2: //down 
      {
      ymax-=(len-1);
      break;
      }
      case 4: //left
      {
        xmin+=(len-1);
        break;
      }
      case 8: //right
    {
      xmax-=(len-1);  
      break;
    }
      default:
      {
        window.console.log("EEEP "+direction);
      }
    }

    var horizontal=direction>2;
    if (horizontal) {
		for (var y=ymin;y<ymax;y++) {
			if (!cellRowMask.bitsSetInArray(level.rowCellContents[y].data) 
			|| !cellRowMask_Movements.bitsSetInArray(level.rowCellContents_Movements[y].data)) {
				continue;
			}

			for (var x=xmin;x<xmax;x++) {
				var i = x*level.height+y;
				if (cellRowMatch(cellRow,i,d, level.objects, level.movements))
				{
					result.push(i);
				}
			}
		}
	} else {
		for (var x=xmin;x<xmax;x++) {
			if (!cellRowMask.bitsSetInArray(level.colCellContents[x].data)
			|| !cellRowMask_Movements.bitsSetInArray(level.colCellContents_Movements[x].data)) {
				continue;
			}

			for (var y=ymin;y<ymax;y++) {
				var i = x*level.height+y;
				if (cellRowMatch(	cellRow,i, d, level.objects, level.movements))
				{
					result.push(i);
				}
			}
		}		
	}

  return result;
}


function matchCellRowWildCard(direction, cellRowMatch, cellRow,cellRowMask,cellRowMask_Movements,d) {
	var result=[];
	if ((!cellRowMask.bitsSetInArray(level.mapCellContents.data))
	|| (!cellRowMask_Movements.bitsSetInArray(level.mapCellContents_Movements.data))) {
		return result;
	}
	
	var xmin=0;
	var xmax=level.width;
	var ymin=0;
	var ymax=level.height;

  var len=cellRow.length-1;//remove one to deal with wildcard
    switch(direction) {
      case 1://up
      {
        ymin+=(len-1);
        break;
      }
      case 2: //down 
      {
      ymax-=(len-1);
      break;
      }
      case 4: //left
      {
        xmin+=(len-1);
        break;
      }
      case 8: //right
    {
      xmax-=(len-1);  
      break;
    }
      default:
      {
        window.console.log("EEEP2 "+direction);
      }
    }



    var horizontal=direction>2;
    if (horizontal) {
		for (var y=ymin;y<ymax;y++) {
			if (!cellRowMask.bitsSetInArray(level.rowCellContents[y].data)
			|| !cellRowMask_Movements.bitsSetInArray(level.rowCellContents_Movements[y].data) ) {
				continue;
			}

			for (var x=xmin;x<xmax;x++) {
				var i = x*level.height+y;
				var kmax;

				if (direction === 4) { //left
					kmax=x-len+2;
				} else if (direction === 8) { //right
					kmax=level.width-(x+len)+1;	
				} else {
					window.console.log("EEEP2 "+direction);					
				}

				result.push.apply(result, cellRowMatch(cellRow,i,kmax,0, d, level.objects, level.movements));
			}
		}
	} else {
		for (var x=xmin;x<xmax;x++) {
			if (!cellRowMask.bitsSetInArray(level.colCellContents[x].data)
			|| !cellRowMask_Movements.bitsSetInArray(level.colCellContents_Movements[x].data)) {
				continue;
			}

			for (var y=ymin;y<ymax;y++) {
				var i = x*level.height+y;
				var kmax;


        if (direction === 2) { // down
          kmax=level.height-(y+len)+1;
        } else if (direction === 1) { // up
          kmax=y-len+2;         
        } else {
          window.console.log("EEEP2 "+direction);
        }
        result.push.apply(result, cellRowMatch(cellRow,i,kmax,0, d, level.objects, level.movements));
      }
    }   
  }

  return result;
}

function generateTuples(lists) {
    var tuples=[[]];

    for (var i=0;i<lists.length;i++)
    {
        var row = lists[i];
        var newtuples=[];
        for (var j=0;j<row.length;j++) {
            var valtoappend = row[j];
            for (var k=0;k<tuples.length;k++) {
                var tuple=tuples[k];
                var newtuple = tuple.concat([valtoappend]);
                newtuples.push(newtuple);
            }
        }
        tuples=newtuples;
    }
    return tuples;
}


Rule.prototype.findMatches = function() {	
	if ( ! this.ruleMask.bitsSetInArray(level.mapCellContents.data) )
		return [];

	const d = level.delta_index(this.direction)

	var matches=[];
	var cellRowMasks=this.cellRowMasks;
	var cellRowMasks_Movements=this.cellRowMasks_Movements;
    for (var cellRowIndex=0;cellRowIndex<this.patterns.length;cellRowIndex++) {
        var cellRow = this.patterns[cellRowIndex];
        var matchFunction = this.cellRowMatches[cellRowIndex];
        if (this.isEllipsis[cellRowIndex]) {//if ellipsis     
        	var match = matchCellRowWildCard(this.direction,matchFunction,cellRow,cellRowMasks[cellRowIndex],cellRowMasks_Movements[cellRowIndex],d);  
        } else {
        	var match = matchCellRow(this.direction,matchFunction,cellRow,cellRowMasks[cellRowIndex],cellRowMasks_Movements[cellRowIndex],d, this.isGlobal);               	
        }
        if (match.length===0) {
            return [];
        } else {
            matches.push(match);
        }
    }
    return matches;
};

Rule.prototype.directional = function(){
  //Check if other rules in its rulegroup with the same line number.
  for (var i=0;i<state.rules.length;i++){
    var rg = state.rules[i];
    var copyCount=0;
    for (var j=0;j<rg.length;j++){
      if (this.lineNumber===rg[j].lineNumber){
        copyCount++;
      }
      if (copyCount>1){
        return true;
      }
    }
  }

    return false;
}

Rule.prototype.applyAt = function(level,tuple,check,delta) {
	var rule = this;
	//have to double check they apply 
	//(cf test ellipsis bug: rule matches two candidates, first replacement invalidates second)
	if (check)
	{
		for (var cellRowIndex=0; cellRowIndex<this.patterns.length; cellRowIndex++)
		{
			if (this.isEllipsis[cellRowIndex]) //if ellipsis
			{
				if ( this.cellRowMatches[cellRowIndex](this.patterns[cellRowIndex], tuple[cellRowIndex][0], tuple[cellRowIndex][1]+1, tuple[cellRowIndex][1], delta, level.objects, level.movements).length == 0 )
					return false
			}
			else if ( ! this.cellRowMatches[cellRowIndex](this.patterns[cellRowIndex], tuple[cellRowIndex], delta, level.objects, level.movements) )
				return false
		}
	}


    var result=false;
    
    //APPLY THE RULE
    for (var cellRowIndex=0;cellRowIndex<rule.patterns.length;cellRowIndex++) {
        var preRow = rule.patterns[cellRowIndex];
        
        var currentIndex = rule.isEllipsis[cellRowIndex] ? tuple[cellRowIndex][0] : tuple[cellRowIndex];
        for (var cellIndex=0;cellIndex<preRow.length;cellIndex++) {
            var preCell = preRow[cellIndex];

            if (preCell === ellipsisPattern) {
            	var k = tuple[cellRowIndex][1];
            	currentIndex += delta*k;
            	continue;
            }

            result = preCell.replace(rule, currentIndex) || result;

            currentIndex += delta;
        }
    }

  if (verbose_logging && result){
    var ruleDirection = dirMaskName[rule.direction];
    if (!rule.directional()){
      ruleDirection="";
    }

		var inspect_ID =  addToDebugTimeline(level,rule.lineNumber);
		var logString = `<font color="green">Rule <a onclick="jumpToLine(${rule.lineNumber});"  href="javascript:void(0);">${rule.lineNumber}</a> ${ruleDirection} applied.</font>`;
		consolePrint(logString,false,rule.lineNumber,inspect_ID);
		
	}

    return result;
};

Rule.prototype.tryApply = function(level) {
	const delta = level.delta_index(this.direction);

    //get all cellrow matches
    var matches = this.findMatches();
    if (matches.length===0) {
      return false;
    }

    var result=false;	
	if (this.hasReplacements) {
	    var tuples = generateTuples(matches);
	    for (var tupleIndex=0;tupleIndex<tuples.length;tupleIndex++) {
	        var tuple = tuples[tupleIndex];
	        var shouldCheck=tupleIndex>0;
	        var success = this.applyAt(level,tuple,shouldCheck,delta);
	        result = success || result;
	    }
	}

    if (matches.length>0) {
      this.queueCommands();
    }
    return result;
};

Rule.prototype.queueCommands = function() {
	var commands = this.commands;
	
	if (commands.length==0){
		return;
	}

	//commandQueue is an array of strings, message.commands is an array of array of strings (For messagetext parameter), so I search through them differently
	var preexisting_cancel=level.commandQueue.indexOf("cancel")>=0;
	var preexisting_restart=level.commandQueue.indexOf("restart")>=0;
	
	var currule_cancel = false;
	var currule_restart = false;
	for (var i=0;i<commands.length;i++){
		var cmd = commands[i][0];
		if (cmd==="cancel"){
			currule_cancel=true;
		} else if (cmd==="restart"){
			currule_restart=true;
		}
	}

	//priority cancel > restart > everything else
	//if cancel is the queue from other rules, ignore everything
	if (preexisting_cancel){
		return;
	}
	//if restart is in the queue from other rules, only apply if there's a cancel present here
	if (preexisting_restart && !currule_cancel){
		return;
	}

	//if you are writing a cancel or restart, clear the current queue
	if (currule_cancel || currule_restart){
		level.commandQueue=[];
        level.commandQueueSourceRules=[];
		messagetext="";
	}

	for(var i=0;i<commands.length;i++) {
		var command=commands[i];
		var already=false;
		if (level.commandQueue.indexOf(command[0])>=0) {
			continue;
		}
		level.commandQueue.push(command[0]);
		level.commandQueueSourceRules.push(this);

		if (verbose_logging){
			var lineNumber = this.lineNumber;
			var ruleDirection = dirMaskName[this.direction];
			var logString = '<font color="green">Rule <a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);">' + lineNumber.toString() + '</a> triggers command '+command[0]+'.</font>';
			consolePrint(logString,false,lineNumber,null);
		}

    if (command[0]==='message') {     
      messagetext=command[1];
    }
	
    if (command[0]==='goto') {
      gotoLevel(command[1]);
    }

    if (state.metadata.runtime_metadata_twiddling !== undefined && twiddleable_params.includes(command[0])) {

      value = command[1];

      if (value == "wipe") {
        delete state.metadata[command[0]]; //value = undefined;
        value = null;
      } else if (value == "default") {
        value = deepClone(state.default_metadata[command[0]]);
      }

      if (value != null) {
        state.metadata[command[0]] = value;
      }
      
      if (command[0] === "zoomscreen" || command[0] === "flickscreen") {
        twiddleMetaData(state, true);
        canvasResize();
      }

      if (command[0] === "smoothscreen") {
        if (value !== undefined) {
          twiddleMetaData(state, true);
          initSmoothCamera()
        } else {
          smoothscreen = false;
        }
        canvasResize();
      }

      twiddleMetadataExtras()

      if (state.metadata.runtime_metadata_twiddling_debug !== undefined) {
        var log = "Metadata twiddled: Flag "+command[0] + " set to " + value;
        if (value != command[1]) {
          log += " ("+command[1]+")"
        }
        consolePrintFromRule(log,this,true);
      }
    }   
  }
};

function twiddleMetadataExtras(resetAutoTick = true) {
  if (state.metadata.realtime_interval!==undefined) {
	if (resetAutoTick) {
		autotick=0;
	}
    autotickinterval=state.metadata.realtime_interval*1000;
  } else {
    autotick=0;
    autotickinterval=0;
  }

  if (state.metadata.again_interval!==undefined) {
    againinterval=state.metadata.again_interval*1000;
  } else {
    againinterval=150;
  }

  if (state.metadata.tween_length!==undefined) {
	tweeninterval=Math.max(state.metadata.tween_length*1000, 0);
	} else {
		tweeninterval = 0;
	}

  if (state.metadata.key_repeat_interval!==undefined) {
    repeatinterval=state.metadata.key_repeat_interval*1000;
  } else {
    repeatinterval=150;
  }

  if ('background_color' in state.metadata) {
    state.bgcolor=colorToHex(colorPalette,state.metadata.background_color);
  } else {
    state.bgcolor="#000000";
  }

  if ('text_color' in state.metadata) {
    state.fgcolor=colorToHex(colorPalette,state.metadata.text_color);
  } else {
    state.fgcolor="#FFFFFF";
  }
}

function showTempMessage() {
if (solving) {return;}

	keybuffer=[];
	textMode=true;
	titleScreen=false;
	quittingMessageScreen=false;
	messageselected=false;
	ignoreNotJustPressedAction=true;
	tryPlayShowMessageSound();
	drawMessageScreen();
	canvasResize();
}

function processOutputCommands(commands) {
	for (var i=0;i<commands.length;i++) {
		var command = commands[i];
		if (command.charAt(1)==='f')  {//identifies sfxN
			tryPlaySimpleSound(command);
		}
		if (unitTesting===false) {
			if (command==='message') {
				showTempMessage();
			}
		}
	}
}

function applyRandomRuleGroup(level,ruleGroup) {
	var propagated=false;

	var matches=[];
	for (var ruleIndex=0;ruleIndex<ruleGroup.length;ruleIndex++) {
		var rule=ruleGroup[ruleIndex];
		var ruleMatches = rule.findMatches();
		if (ruleMatches.length>0) {
	    	var tuples  = generateTuples(ruleMatches);
	    	for (var j=0;j<tuples.length;j++) {
	    		var tuple=tuples[j];
				matches.push([ruleIndex,tuple]);
	    	}
		}		
	}

  if (matches.length===0)
  {
    return false;
  } 

	var match = matches[Math.floor(RandomGen.uniform()*matches.length)];
	var ruleIndex=match[0];
	var rule=ruleGroup[ruleIndex];
	var tuple=match[1];
	var check=false;
	const delta = level.delta_index(rule.direction)
	var modified = rule.applyAt(level,tuple,check,delta);

    rule.queueCommands();

  return modified;
}


function applyRuleGroup(ruleGroup) {
	if (ruleGroup[0].isRandom) {
		return applyRandomRuleGroup(level,ruleGroup);
	}

  var loopPropagated=false;
    var propagated=true;
    var loopcount=0;
	var nothing_happened_counter = -1;
    while(propagated) {
      loopcount++;
      if (loopcount>200) 
      {
        logErrorCacheable("Got caught looping lots in a rule group :O",ruleGroup[0].lineNumber,true);
        break;
      }
        propagated=false;

        for (var ruleIndex=0;ruleIndex<ruleGroup.length;ruleIndex++) {
            var rule = ruleGroup[ruleIndex];     
			if (rule.tryApply(level)){
				propagated=true;
				nothing_happened_counter=0;//why am I resetting to 1 rather than 0? because I've just verified that applications of the current rule are exhausted
			} else {
				nothing_happened_counter++;
			}
			if ( nothing_happened_counter === ruleGroup.length)
				break;
        }
        if (propagated) {
        	loopPropagated=true;
			
			if (verbose_logging){
				debugger_turnIndex++;
				addToDebugTimeline(level,-2);//pre-movement-applied debug state
			}
        }
    }

    return loopPropagated;
}

function applyRules(rules, loopPoint, startRuleGroupindex, bannedGroup){
    //for each rule
    //try to match it

    playerPositions = getPlayerPositions();

    //when we're going back in, let's loop, to be sure to be sure
    var loopPropagated = startRuleGroupindex>0;
    var loopCount = 0;
    for (var ruleGroupIndex=startRuleGroupindex;ruleGroupIndex<rules.length;) {
      if (bannedGroup && bannedGroup[ruleGroupIndex]) {
        //do nothing
      } else {
        var ruleGroup=rules[ruleGroupIndex];
      loopPropagated = applyRuleGroup(ruleGroup) || loopPropagated;
      }
        if (loopPropagated && loopPoint[ruleGroupIndex]!==undefined) {
        	ruleGroupIndex = loopPoint[ruleGroupIndex];
        	loopPropagated=false;
        	loopCount++;
			if (loopCount > 200) {
    			var ruleGroup=rules[ruleGroupIndex];
			   	logErrorCacheable("got caught in an endless startloop...endloop vortex, escaping!", ruleGroup[0].lineNumber,true);
			   	break;
			}
			
			if (verbose_logging){
				debugger_turnIndex++;
				addToDebugTimeline(level,-2);//pre-movement-applied debug state
			}
        } else {
        	ruleGroupIndex++;
        	if (ruleGroupIndex===rules.length) {
        		if (loopPropagated && loopPoint[ruleGroupIndex]!==undefined) {
		        	ruleGroupIndex = loopPoint[ruleGroupIndex];
		        	loopPropagated=false;
		        	loopCount++;
					if (loopCount > 200) {
		    			var ruleGroup=rules[ruleGroupIndex];
					   	logErrorCacheable("got caught in an endless startloop...endloop vortex, escaping!", ruleGroup[0].lineNumber,true);
					   	break;
					}
		        } 
        	}
			
			if (verbose_logging){
				debugger_turnIndex++;
				addToDebugTimeline(level,-2);//pre-movement-applied debug state
			}
        }
    }
}


//if this returns!=null, need to go back and reprocess
function resolveMovements(level, bannedGroup){
	var moved=true;

    while(moved){
        moved=false;
        for (var i=0;i<level.n_tiles;i++) {
		  moved = repositionEntitiesAtCell(i) || moved;
        }
    }
    var doUndo=false;

	for (var i=0;i<level.n_tiles;i++) {
		var cellMask = level.getCellInto(i,_o6);
		var movementMask = level.getMovements(i);
		if (!movementMask.iszero()) {
			var rigidMovementAppliedMask = level.rigidMovementAppliedMask[i];
			if (rigidMovementAppliedMask !== 0) {
				movementMask.iand(rigidMovementAppliedMask);
				if (!movementMask.iszero()) {
					//find what layer was restricted
					for (var j=0;j<level.layerCount;j++) {
						var layerSection = movementMask.getshiftor(0x1f, 5*j);
						if (layerSection!==0) {
							//this is our layer!
							var rigidGroupIndexMask = level.rigidGroupIndexMask[i];
							var rigidGroupIndex = rigidGroupIndexMask.getshiftor(0x1f, 5*j);
							rigidGroupIndex--;//group indices start at zero, but are incremented for storing in the bitfield
							var groupIndex = state.rigidGroupIndex_to_GroupIndex[rigidGroupIndex];
							bannedGroup[groupIndex]=true;
							//backtrackTarget = rigidBackups[rigidGroupIndex];
							doUndo=true;
							break;
						}
					}
				}
			}
			for (var j=0;j<state.sfx_MovementFailureMasks.length;j++) {
				var o = state.sfx_MovementFailureMasks[j];
				var objectMask = o.objectMask;
				if (objectMask.anyBitsInCommon(cellMask)) {
					var directionMask = o.directionMask;
					if (movementMask.anyBitsInCommon(directionMask) && seedsToPlay_CantMove.indexOf(o.seed)===-1) {
						seedsToPlay_CantMove.push(o.seed);
					}
				}
			}
    	}

    	for (var j=0;j<STRIDE_MOV;j++) {
    		level.movements[j+i*STRIDE_MOV]=0;
    	}
	    level.rigidGroupIndexMask[i]=0;
	    level.rigidMovementAppliedMask[i]=0;
    }
    return doUndo;
}

var sfxCreateMask=null;
var sfxDestroyMask=null;

function calculateRowColMasks() {
	for(var i=0;i<level.mapCellContents.length;i++) {
		level.mapCellContents[i]=0;
		level.mapCellContents_Movements[i]=0;	
	}

	for (var i=0;i<level.width;i++) {
		var ccc = level.colCellContents[i];
		ccc.setZero();
		var ccc_Movements = level.colCellContents_Movements[i];
		ccc_Movements.setZero();
	}

	for (var i=0;i<level.height;i++) {
		var rcc = level.rowCellContents[i];
		rcc.setZero();
		var rcc_Movements = level.rowCellContents_Movements[i];
		rcc_Movements.setZero();
	}

	for (var i=0;i<level.width;i++) {
		for (var j=0;j<level.height;j++) {
			var index = j+i*level.height;
			var cellContents=level.getCellInto(index,_o9);
			level.mapCellContents.ior(cellContents);
			level.rowCellContents[j].ior(cellContents);
			level.colCellContents[i].ior(cellContents);

			
			var mapCellContents_Movements=level.getMovementsInto(index,_m1);
			level.mapCellContents_Movements.ior(mapCellContents_Movements);
			level.rowCellContents_Movements[j].ior(mapCellContents_Movements);
			level.colCellContents_Movements[i].ior(mapCellContents_Movements);
		}
	}
}

var playerPositions;
var playerPositionsAtTurnStart;

/* returns a bool indicating if anything changed */
function processInput(dir,dontDoWin,dontModify,bak) {
	if (!dontModify) {
		newMovedEntities = {};
	}

var startDir = dir;

	againing = false;

	if (bak==undefined) {
		bak = backupLevel();
	}
  
  playerPositions= [];
playerPositionsAtTurnStart = getPlayerPositions();

    if (dir<=5) {

      if (verbose_logging) { 
        debugger_turnIndex++;
        addToDebugTimeline(level,-2);//pre-movement-applied debug state
      }

    	if (dir>=0 && dir<=4) {
	        switch(dir){
	            case 0://up
	            {
	                dir=parseInt('00001', 2);;
	                break;
	            }
	            case 1://left
	            {
	                dir=parseInt('00100', 2);;
	                break;
	            }
	            case 2://down
	            {
	                dir=parseInt('00010', 2);;
	                break;
	            }
	            case 3://right
	            {
	                dir=parseInt('01000', 2);;
	                break;
	            }
	            case 4://action
	            {
	                dir=parseInt('10000', 2);;
	                break;
				      }
	        }
	        playerPositions = startMovement(dir);
		}
			
		
		if (verbose_logging) { 
			consolePrint('Applying rules');

			var inspect_ID = addToDebugTimeline(level,-1);
				
			 if (dir===-1) {
				 consolePrint(`Turn starts with no input.`,false,null,inspect_ID)
			 } else {
				//  consolePrint('=======================');
				consolePrint(`Turn starts with input of ${['up','left','down','right','action','mouse'][startDir]}.`,false,null,inspect_ID);
			 }
		}

		
        bannedGroup = [];
        level.commandQueue=[];
        level.commandQueueSourceRules=[];
        var startRuleGroupIndex=0;
        var rigidloop=false;
		const startState = {
			objects: new Int32Array(level.objects),
			movements: new Int32Array(level.movements),
			rigidGroupIndexMask: level.rigidGroupIndexMask.concat([]),
			rigidMovementAppliedMask: level.rigidMovementAppliedMask.concat([]),
			commandQueue: [],
			commandQueueSourceRules: []
		}
	    sfxCreateMask.setZero();
	    sfxDestroyMask.setZero();

    seedsToPlay_CanMove=[];
    seedsToPlay_CantMove=[];

    calculateRowColMasks();

        var i=0;
        do {
        //not particularly elegant, but it'll do for now - should copy the world state and check
        //after each iteration
        	rigidloop=false;
        	i++;
        	


			applyRules(state.rules, state.loopPoint, startRuleGroupIndex, bannedGroup);
			
        	var shouldUndo = resolveMovements(level,bannedGroup);

        	if (shouldUndo) {
        		rigidloop=true;

				{
					// trackback
					consolePrint("Rigid movement application failed. Rolling back...")
					//don't need to concat or anythign here, once something is restored it won't be used again.
					level.objects = new Int32Array(startState.objects)
					level.movements = new Int32Array(startState.movements)
					level.rigidGroupIndexMask = startState.rigidGroupIndexMask.concat([])
					level.rigidMovementAppliedMask = startState.rigidMovementAppliedMask.concat([])
					// TODO: shouldn't we also save/restore the level data computed by level.calculateRowColMasks() ?
					level.commandQueue = startState.commandQueue.concat([])
					level.commandQueueSourceRules = startState.commandQueueSourceRules.concat([])
					sfxCreateMask.setZero()
					sfxDestroyMask.setZero()
					// TODO: should

				}

				if (verbose_logging && rigidloop && i>0){				
					consolePrint('Relooping through rules because of rigid.');
						
					debugger_turnIndex++;
					addToDebugTimeline(level,-2);//pre-movement-applied debug state
				}

        		startRuleGroupIndex=0;//rigidGroupUndoDat.ruleGroupIndex+1;
        	} else {
        		if (verbose_logging){

					var eof_idx = debug_visualisation_array[debugger_turnIndex].length+1;//just need some number greater than any rule group
					var inspect_ID = addToDebugTimeline(level,eof_idx);

					consolePrint(`Processed movements.`,false,null,inspect_ID);
					
					if (state.lateRules.length>0){
											
						debugger_turnIndex++;
						addToDebugTimeline(level,-2);//pre-movement-applied debug state
					
						consolePrint('Applying late rules');
					}
				}
        		applyRules(state.lateRules, state.lateLoopPoint, 0);
        		startRuleGroupIndex=0;
        	}
        } while (i < 250 && rigidloop);

        if (i>=250) {
          consolePrint("looped through 250 times, gave up. Too many loops!");
          
          applyRules(state.lateRules, state.lateLoopPoint, 0);
          startRuleGroupIndex=0;
          
          backups.push(bak);
          DoUndo(true,false);
          return false;
        }

		/// Taken from zarawesome, thank you :)
		if (level.commandQueue.indexOf('undo')>=0) {
			if (verbose_logging) {
				consoleCacheDump();
				consolePrint('UNDO command executed, undoing turn.',true);
			}
			messagetext = "";
			DoUndo(true,false, true, true, true);
			return true;
		}

        if (playerPositionsAtTurnStart.length>0 && state.metadata.require_player_movement!==undefined && dir >= 0) {
        	var somemoved=false;
        	for (var i=0;i<playerPositionsAtTurnStart.length;i++) {
        		var pos = playerPositionsAtTurnStart[i];
        		var val = level.getCell(pos);
        		if (state.playerMask.bitsClearInArray(val.data)) {
        			somemoved=true;
        			break;
        		}
        	}
        	if (somemoved===false) {
        		if (verbose_logging){
	    			consolePrint('require_player_movement set, but no player movement detected, so cancelling turn.');
	    			consoleCacheDump();
				}
        		addUndoState(bak);
        		DoUndo(true,false, false);
        		return false;
        	}
        	//play player cantmove sounds here
        }



	    if (level.commandQueue.indexOf('cancel')>=0) {
	    	if (verbose_logging) { 
	    		consoleCacheDump();
	    		var r = level.commandQueueSourceRules[level.commandQueue.indexOf('cancel')];
	    		consolePrintFromRule('CANCEL command executed, cancelling turn.',r,true);
			}
			processOutputCommands(level.commandQueue);
    		addUndoState(bak);
    		DoUndo(true,false, false, false);
    		tryPlayCancelSound();
    		return false;
	    } 

	    if (level.commandQueue.indexOf('restart')>=0) {
	    	if (verbose_logging) { 
	    		var r = level.commandQueueSourceRules[level.commandQueue.indexOf('restart')];
	    		consolePrintFromRule('RESTART command executed, reverting to restart state.',r);
	    		consoleCacheDump();
			}
			processOutputCommands(level.commandQueue);
    		addUndoState(bak);
	    	DoRestart(true);
    		return true;
		}
		
		if (level.commandQueue.indexOf('quit')>=0 && !solving) {
			if (verbose_logging) { 
				var r = level.commandQueueSourceRules[level.commandQueue.indexOf('quit')];
				consolePrintFromRule('QUIT command executed, exiting level.',r);
				consoleCacheDump();
			}
			if (state.metadata.level_select !== undefined) {
				gotoLevelSelectScreen();
			} else {
				goToTitleScreen();
			}
			messagetext = "";
			canvasResize();	
			return true;
		}

	    if (dontModify && level.commandQueue.indexOf('win')>=0) {
	    	return true;
		}
		
		var save_backup = true;
		if(!winning && level.commandQueue.indexOf('nosave')>=0) {
			if (verbose_logging) { 
				var r = level.commandQueueSourceRules[level.commandQueue.indexOf('nosave')];
				consolePrintFromRule('NOSAVE command executed, not storing current state to undo queue.',r);
			}
			save_backup = false;
		}
	    
        var modified=false;
	    for (var i=0;i<level.objects.length;i++) {
	    	if (level.objects[i]!==bak.dat[i]) {
				if (dontModify) {
	        		if (verbose_logging) {
	        			consoleCacheDump();
	        		}
	        		addUndoState(bak);
	        		DoUndo(true,false, false);
					return true;
				} else {
					if (dir!==-1 && save_backup) {
						addUndoState(bak);
					} else if (backups.length > 0) {
						// This is for the case that diffs break the undo buffer for real-time games 
						// ( c f https://github.com/increpare/PuzzleScript/pull/796 ),
						// because realtime ticks are ignored when the user presses undo and the backup
						// array reflects this structure.  
						backups[backups.length - 1] = unconsolidateDiff(backups[backups.length - 1], bak);					
	    			}
	    			modified=true;
	    			updateCameraPositionTarget();
	    		}
	    		break;
	    	}
	    }

		if (dontModify && level.commandQueue.indexOf('win')>=0) {	
	    	return true;	
		}
		
		if (dontModify) {		
    		if (verbose_logging) {
    			consoleCacheDump();
    		}
			return false;
		}

        for (var i=0;i<seedsToPlay_CantMove.length;i++) {
            playSound(seedsToPlay_CantMove[i]);
        }

        for (var i=0;i<seedsToPlay_CanMove.length;i++) {
            playSound(seedsToPlay_CanMove[i]);
        }

        for (var i=0;i<state.sfx_CreationMasks.length;i++) {
          var entry = state.sfx_CreationMasks[i];
          if (sfxCreateMask.anyBitsInCommon(entry.objectMask)) {
            playSound(entry.seed);
          }
        }

        for (var i=0;i<state.sfx_DestructionMasks.length;i++) {
          var entry = state.sfx_DestructionMasks[i];
          if (sfxDestroyMask.anyBitsInCommon(entry.objectMask)) {
            playSound(entry.seed);
          }
        }

	    processOutputCommands(level.commandQueue);

	    if (textMode===false) {
	    	if (verbose_logging) { 
	    		consolePrint('Checking win conditions.');
			}
			if (dontDoWin===undefined){
				dontDoWin = false;
			}
	    	checkWin( dontDoWin );
	    }

	    if (!winning) {
			if (level.commandQueue.indexOf('checkpoint')>=0) {
		    	if (verbose_logging) { 
	    			var r = level.commandQueueSourceRules[level.commandQueue.indexOf('checkpoint')];
		    		consolePrintFromRule('CHECKPOINT command executed, saving current state to the restart state.',r);
				}
				restartTarget=level4Serialization();
				hasUsedCheckpoint=true;
				var backupStr = JSON.stringify(restartTarget);
				storage_set(document.URL+'_checkpoint',backupStr);
				storage_set(document.URL,curlevel);				
			}	 

		    if (level.commandQueue.indexOf('again')>=0 && modified) {

	    		var r = level.commandQueueSourceRules[level.commandQueue.indexOf('again')];

		    	//first have to verify that something's changed
		    	var old_verbose_logging=verbose_logging;
		    	var oldmessagetext = messagetext;
		    	verbose_logging=false;
		    	if (processInput(-1,true,true)) {
			    	verbose_logging=old_verbose_logging;

			    	if (verbose_logging) { 
			    		consolePrintFromRule('AGAIN command executed, with changes detected - will execute another turn.',r);
					}

			    	againing=true;
			    	timer=0;
			    } else {		    	
			    	verbose_logging=old_verbose_logging;
					if (verbose_logging) { 
						consolePrintFromRule('AGAIN command not executed, it wouldn\'t make any changes.',r);
					}
			    }
			    verbose_logging=old_verbose_logging;
			    messagetext = oldmessagetext;
		    }   
		}
		
		if (verbose_logging) { 
			consolePrint(`Turn complete`);    
		}

		currentMovedEntities = newMovedEntities;
		tweentimer = 0;
		
	    level.commandQueue=[];
	    level.commandQueueSourceRules=[];

    }

  if (verbose_logging) {
    consoleCacheDump();
  }

  if (winning) {
    againing=false;
  }

  return modified;
}

function checkWin(dontDoWin) {

  if (levelEditorOpened) {
    dontDoWin=true;
  }

	if (level.commandQueue.indexOf('win')>=0) {
		if (runrulesonlevelstart_phase){
			consolePrint("Win Condition Satisfied (However this is in the run_rules_on_level_start rule pass, so I'm going to ignore it for you.  Why would you want to complete a level before it's already started?!)");		
		} else {
			if (!solving) {
				consolePrint("Win Condition Satisfied");
			}
		}
		if(!dontDoWin){
			DoWin();
		}
		return;
	}

	var won= false;
	if (state.winconditions.length>0)  {
		var passed=true;
		for (var wcIndex=0;wcIndex<state.winconditions.length;wcIndex++) {
			var wincondition = state.winconditions[wcIndex];
			var filter1 = wincondition[1];
			var filter2 = wincondition[2];
			var rulePassed=true;
			switch(wincondition[0]) {
				case -1://NO
				{
					for (var i=0;i<level.n_tiles;i++) {
						var cell = level.getCellInto(i,_o10);
						if ( (!filter1.bitsClearInArray(cell.data)) &&  
							 (!filter2.bitsClearInArray(cell.data)) ) {
							rulePassed=false;
							break;
						}
					}

          break;
        }
        case 0://SOME
        {
          var passedTest=false;
          for (var i=0;i<level.n_tiles;i++) {
            var cell = level.getCellInto(i,_o10);
            if ( (!filter1.bitsClearInArray(cell.data)) &&  
               (!filter2.bitsClearInArray(cell.data)) ) {
              passedTest=true;
              break;
            }
          }
          if (passedTest===false) {
            rulePassed=false;
          }
          break;
        }
        case 1://ALL
        {
          for (var i=0;i<level.n_tiles;i++) {
            var cell = level.getCellInto(i,_o10);
            if ( (!filter1.bitsClearInArray(cell.data)) &&  
               (filter2.bitsClearInArray(cell.data)) ) {
              rulePassed=false;
              break;
            }
          }
          break;
        }
      }
      if (rulePassed===false) {
        passed=false;
      }
    }
    won=passed;
  }

	if (won) {
		if (runrulesonlevelstart_phase){
			consolePrint("Win Condition Satisfied (However this is in the run_rules_on_level_start rule pass, so I'm going to ignore it for you.  Why would you want to complete a level before it's already started?!)");		
		} else {
			if (!solving) {
				consolePrint("Win Condition Satisfied");
			}
		}
		if (!dontDoWin){
			DoWin();
		}
	}
}

function DoWin() {
  if (winning) {
    return;
  }
  againing=false;
  tryPlayEndLevelSound();
  if (unitTesting) {
    nextLevel();
    return;
  }

  winning=true;
  timer=0;
}

/*
//this function isn't valid after refactoring, but also isn't used.
function anyMovements() { 
    for (var i=0;i<level.movementMask.length;i++) {
        if (level.movementMask[i]!==0) {
          return true;
        }
    }
    return false;
}*/

function nextLevel() {
    againing=false;
	messagetext="";
	if (state && state.levels && (curlevel>state.levels.length) ){
		curlevel=state.levels.length-1;
	}
  
  ignoreNotJustPressedAction=true;
	if (titleScreen && titleMode <= 1) {
		if(isContinueOptionSelected()) {
			// continue
			loadLevelFromStateOrTarget();
		} else if(isNewGameOptionSelected()) {
			// new game
			curlevel=0;
			curlevelTarget=null;

			if (state.metadata.level_select === undefined) {
				clearLocalStorage();
			}

			loadLevelFromStateOrTarget();
		} else if(isLevelSelectOptionSelected()) {
			// level select
			titleSelection = 0;
			gotoLevelSelectScreen();
		} else {
			// settings
			// TODO
		}
	} else {
		if (hasUsedCheckpoint){
			curlevelTarget=null;
			hasUsedCheckpoint=false;
		}

		if (curlevel<(state.levels.length-1)) {
			var skip = false;
			var curSection = state.levels[Number(curlevel)].section;
			var nextSection = state.levels[Number(curlevel)+1].section;
			if(nextSection != curSection) {
				setSectionSolved(state.levels[Number(curlevel)].section);
				
				if(solvedSections.length == state.sections.length && state.winSection != undefined) {
					curlevel = state.winSection.firstLevel - 1; // it's gonna be increased to match few lines below
				} else if (nextSection == "__WIN__") {
					gotoLevelSelectScreen();
					skip = true;
				}		
			}

			if(!skip) {
				curlevel++;
				curlevelTarget=null;
				textMode=false;
				titleScreen=false;
				quittingMessageScreen=false;
				messageselected=false;
	
				loadLevelFromStateOrTarget();
			}
		} else {
			if(solvedSections.length == state.sections.length) {
				if(state.metadata["level_select"] === undefined) {
					// solved all
          try{
            storage_remove(document.URL);
            storage_remove(document.URL+'_checkpoint');				
          } catch(ex){
          }
					
					curlevel=0;
					curlevelTarget=null;
					goToTitleScreen();
				} else {
					gotoLevelSelectScreen();
				}
				
				tryPlayEndGameSound();	
			} else {
				if(state.levels[Number(curlevel)].section != null) {
					setSectionSolved(state.levels[Number(curlevel)].section);
				}
				gotoLevelSelectScreen();
			}
		}		
		//continue existing game
	}

	updateLocalStorage();
	resetFlickDat();
	canvasResize();	
}

function loadLevelFromStateOrTarget() {
	if (curlevelTarget!==null){			
		loadLevelFromStateTarget(state,curlevel,curlevelTarget);
	} else {
		loadLevelFromState(state,curlevel);
	}
}

function goToTitleScreen(){
    againing=false;
	messagetext="";
	titleScreen=true;
	textMode=true;
	hoverSelection=-1;
	doSetupTitleScreenLevelContinue();
  //titleSelection=showContinueOptionOnTitleScreen()?1:0;
  
  state.metadata = deepClone(state.default_metadata);
  twiddleMetadataExtras();

  if (canvas!==null){//otherwise triggers error in cat bastard test
		regenSpriteImages();
	}

	generateTitleScreen();
}

function resetFlickDat() {
	if (state!==undefined && state.metadata.flickscreen!==undefined){
		oldflickscreendat=[0,0,Math.min(state.metadata.flickscreen[0],level.width),Math.min(state.metadata.flickscreen[1],level.height)];
	}
}

function updateLocalStorage() {
	try {
		
		storage_set(document.URL,curlevel);
		if (curlevelTarget!==null){
			restartTarget=level4Serialization();
			var backupStr = JSON.stringify(restartTarget);
			storage_set(document.URL+'_checkpoint',backupStr);
		} else {
			storage_remove(document.URL+"_checkpoint");
		}		
		
	} catch (ex) {
  }
}

function setSectionSolved(section) {
	if(section == null || section == undefined) {
		return;
	}

	if(section.name == "__WIN__") {
		return;
	}

	if(solvedSections.indexOf(section) >= 0) {
		return;
	}

	try {
		if(!!window.localStorage) {
			solvedSections.push(section);
			localStorage.setItem(document.URL + "_sections", JSON.stringify(solvedSections));
		}
	} catch(ex) { }
}

function clearLocalStorage() {
	curlevel = 0;
	curlevelTarget = null;
	solvedSections = [];

	try {
		if (!!window.localStorage) {
			localStorage.removeItem(document.URL);
			localStorage.removeItem(document.URL+'_checkpoint');
			localStorage.removeItem(document.URL+'_sections');
		}
	} catch(ex){ }
}

var cameraPositionTarget = null;

var cameraPosition = {
  x: 0,
  y: 0
};

function initSmoothCamera() {
    if (state===undefined || state.metadata.smoothscreen===undefined) {
        return;
    }

    screenwidth=state.metadata.smoothscreen.screenSize.width;
    screenheight=state.metadata.smoothscreen.screenSize.height;

    var boundarySize = state.metadata.smoothscreen.boundarySize;
    var flick = state.metadata.smoothscreen.flick;

    var playerPositions = getPlayerPositions();
    if (playerPositions.length>0) {
        var playerPosition = {
            x: (playerPositions[0]/(level.height))|0,
            y: (playerPositions[0]%level.height)|0
        };

        cameraPositionTarget = {
            x: flick
              ? getFlickCameraPosition(playerPosition.x, level.width, screenwidth, boundarySize.width)
              : getCameraPosition(playerPosition.x, level.width, screenwidth),
            y: flick
              ? getFlickCameraPosition(playerPosition.y, level.height, screenheight, boundarySize.height)
              : getCameraPosition(playerPosition.y, level.height, screenheight)
        };

        cameraPosition.x = cameraPositionTarget.x;
        cameraPosition.y = cameraPositionTarget.y;
    }
}

function getCameraPosition (targetPosition, levelDimension, screenDimension) {
    return Math.min(
        Math.max(targetPosition, Math.floor(screenDimension / 2)),
        levelDimension - Math.ceil(screenDimension / 2)
    );
}

function getFlickCameraPosition (targetPosition, levelDimension, screenDimension, boundaryDimension) {
    var flickGridOffset = (Math.floor(screenDimension / 2) - Math.floor(boundaryDimension / 2));
    var flickGridPlayerPosition = targetPosition - flickGridOffset;
    var flickGridPlayerCell = Math.floor(flickGridPlayerPosition / boundaryDimension);
    var maxFlickGridCell = Math.floor((levelDimension - Math.ceil(screenDimension / 2) - Math.floor(boundaryDimension / 2) - flickGridOffset) / boundaryDimension);

    return Math.min(Math.max(flickGridPlayerCell, 0), maxFlickGridCell) * boundaryDimension + Math.floor(screenDimension / 2);
}

function updateCameraPositionTarget() {
    var smoothscreenConfig = state.metadata.smoothscreen;
    var playerPositions = getPlayerPositions();

    if (!smoothscreenConfig || playerPositions.length === 0) {
        return
    }

    var playerPosition = {
        x: (playerPositions[0]/(level.height))|0,
        y: (playerPositions[0]%level.height)|0
    };

    ['x', 'y'].forEach(function (coord) {
        var screenDimension = coord === 'x' ? screenwidth : screenheight;

        var dimensionName = coord === 'x' ? 'width' : 'height';
        var levelDimension = level[dimensionName];
        var boundaryDimension = smoothscreenConfig.boundarySize[dimensionName];

        var playerVector = playerPosition[coord] - cameraPositionTarget[coord];
        var direction = Math.sign(playerVector);
        var boundaryVector = direction > 0
          ? Math.ceil(boundaryDimension / 2)
          : -(Math.floor(boundaryDimension / 2) + 1);

        if (Math.abs(playerVector) - Math.abs(boundaryVector) >= 0) {
            cameraPositionTarget[coord] = smoothscreenConfig.flick
              ? getFlickCameraPosition(playerPosition[coord], levelDimension, screenDimension, boundaryDimension)
              : getCameraPosition(playerPosition[coord] - boundaryVector + direction, levelDimension, screenDimension);
        }
    })
}


function IsMouseGameInputEnabled() {
	return "mouse_left" in state.metadata || "mouse_drag" in state.metadata || "mouse_up" in state.metadata;
}
// @@end js/engine.js


// @@begin js/parser.js
/*
credits

brunt of the work by increpare (www.increpare.com)

all open source mit license blah blah

testers:
none, yet

code used

colors used
color values for named colours from arne, mostly (and a couple from a 32-colour palette attributed to him)
http://androidarts.com/palette/16pal.htm

the editor is a slight modification of codemirro (codemirror.net), which is crazy awesome.

for post-launch credits, check out activty on github.com/increpare/PuzzleScript

*/

var compiling = false;
var errorStrings = [];//also stores warning strings
var errorCount=0;//only counts errors

var twiddleable_params = ['background_color','text_color','key_repeat_interval','realtime_interval','again_interval','flickscreen','zoomscreen','smoothscreen','noundo','norestart','message_text_align']; //Please note that you have to add these twiddleable properties in more locations that just here!

function logErrorCacheable(str, lineNumber,urgent) {
    if (compiling||urgent) {
        if (lineNumber === undefined) {
            return logErrorNoLine(str,urgent);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="errorText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString);
            errorStrings.push(errorString);
            errorCount++;
        }
    }
}

function logError(str, lineNumber,urgent) {
    if (compiling||urgent) {
        if (lineNumber === undefined) {
            return logErrorNoLine(str,urgent);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="errorText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
            errorCount++;
        }
    }
}

function logWarning(str, lineNumber,urgent) {
    if (compiling||urgent) {
        if (lineNumber === undefined) {
            return logWarningNoLine(str,urgent);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="warningText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
    }
}

function logWarningNoLine(str,urgent, increaseErrorCount = true) {
    if (compiling||urgent) {
        var errorString = '<span class="warningText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
        if (increaseErrorCount) {
            errorCount++;
        }
    }
}


function logErrorNoLine(str,urgent) {
    if (compiling||urgent) {
        var errorString = '<span class="errorText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
        errorCount++;
    }
}



function logBetaMessage(str,urgent){
    if (compiling||urgent) {
        var errorString = '<span class="betaText">' + str + '</span>';
         if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
         } else {
            consoleError(errorString);
            errorStrings.push(errorString);
        }
    }  
}

function blankLineHandle(state) {
    if (state.section === 'levels') {
            if (state.levels[state.levels.length - 1].length > 0)
            {
                state.levels.push([]);
            }
    } else if (state.section === 'objects') {
        state.objects_section = 0;
    }
}

//for IE support
if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      // We must check against these specific cases.
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
 
      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

var codeMirrorFn = function() {
    'use strict';


    function searchStringInArray(str, strArray) {
        for (var j = 0; j < strArray.length; j++) {
            if (strArray[j] === str) { return j; }
        }
        return -1;
    }

    function isMatrixLine(str) {
        for (var j = 0; j < str.length; j++) {
            if (str.charAt(j) !== '.' && str.charAt(j) !== '0') {
                return false;
            }
        }
        return true;
    }

    function checkNameNew(state,candname) {
        if (state.objects[candname] !== undefined) {
            logError('Object "' + candname + '" defined multiple times.', state.lineNumber);
            return 'ERROR';
        }
        for (var i=0;i<state.legend_synonyms.length;i++) {
            var entry = state.legend_synonyms[i];
            if (entry[0]==candname) {
                logError('Name "' + candname + '" already in use.', state.lineNumber);                                        
            }
        }
        for (var i=0;i<state.legend_aggregates.length;i++) {
            var entry = state.legend_aggregates[i];
            if (entry[0]==candname) {
                logError('Name "' + candname + '" already in use.', state.lineNumber);                                        
            }
        }
        for (var i=0;i<state.legend_properties.length;i++) {
            var entry = state.legend_properties[i];
            if (entry[0]==candname) {
                logError('Name "' + candname + '" already in use.', state.lineNumber);                                        
            }
        }
    }
    //var absolutedirs = ['up', 'down', 'right', 'left'];
    //var relativedirs = ['^', 'v', '<', '>', 'moving','stationary','parallel','perpendicular', 'no'];
    //var logicWords = ['all', 'no', 'on', 'some'];
    var sectionNames = ['objects', 'legend', 'sounds', 'collisionlayers', 'rules', 'winconditions', 'levels'];
    var commandwords = ["sfx0","sfx1","sfx2","sfx3","sfx4","sfx5","sfx6","sfx7","sfx8","sfx9","sfx10","cancel","checkpoint","restart","win","message","again","undo",
    "nosave","quit","zoomscreen","flickscreen","smoothscreen","again_interval","realtime_interval","key_repeat_interval",'noundo','norestart','background_color','text_color','goto','message_text_align'];
	
    var reg_commands = /[\p{Z}\s]*(sfx0|sfx1|sfx2|sfx3|Sfx4|sfx5|sfx6|sfx7|sfx8|sfx9|sfx10|cancel|checkpoint|restart|win|message|again|undo|nosave)[\p{Z}\s]*/ui;
    var reg_name = /[\p{L}\p{N}_]+[\p{Z}\s]*/u;///\w*[a-uw-zA-UW-Z0-9_]/;
    var reg_number = /[\d]+/;
    var reg_soundseed = /\d+\b/;
    var reg_spriterow = /[\.0-9]{5}[\p{Z}\s]*/u;
    var reg_sectionNames = /(objects|collisionlayers|legend|sounds|rules|winconditions|levels)(?![\p{L}\p{N}_])[\p{Z}\s]*/ui;
    var reg_equalsrow = /[\=]+/;
    var reg_notcommentstart = /[^\(]+/;
    var reg_csv_separators = /[ \,]*/;
    var reg_soundverbs = /(move|action|create|destroy|cantmove|undo|restart|titlescreen|startgame|cancel|endgame|startlevel|endlevel|showmessage|closemessage|sfx0|sfx1|sfx2|sfx3|sfx4|sfx5|sfx6|sfx7|sfx8|sfx9|sfx10)\b[\p{Z}\s]*/ui;
    var reg_directions = /^(action|up|down|left|right|\^|v|\<|\>|moving|stationary|parallel|perpendicular|horizontal|orthogonal|vertical|no|randomdir|random)$/i;
    var reg_loopmarker = /^(startloop|endloop)$/;
    var reg_ruledirectionindicators = /^(up|down|left|right|horizontal|vertical|orthogonal|late|rigid)$/i;
    var reg_sounddirectionindicators = /[\p{Z}\s]*(up|down|left|right|horizontal|vertical|orthogonal)(?![\p{L}\p{N}_])[\p{Z}\s]*/ui;
    var reg_winconditionquantifiers = /^(all|any|no|some)$/i;
    var reg_keywords = /(checkpoint|objects|collisionlayers|legend|sounds|rules|winconditions|\.\.\.|levels|up|down|left|right|^|\||\[|\]|v|\>|\<|no|horizontal|orthogonal|vertical|any|all|no|some|moving|stationary|parallel|perpendicular|action|nosave)/i;
    var preamble_params = ['title','author','homepage','background_color','text_color','key_repeat_interval','realtime_interval','again_interval','flickscreen','zoomscreen','smoothscreen','color_palette','youtube',
      'sprite_size','level_select_unlocked_ahead','level_select_solve_symbol','custom_font', 'mouse_left','mouse_drag','mouse_right','mouse_rdrag','mouse_up','mouse_rup','local_radius','font_size', 'tween_length', "tween_easing", "tween_snap", "message_text_align", "text_controls", "text_message_continue", "level_select_unlocked_rollover", "sitelock_origin_whitelist", "sitelock_hostname_whitelist"];
    var preamble_keywords = ['run_rules_on_level_start','norepeat_action','require_player_movement','debug','verbose_logging','throttle_movement','noundo','noaction','norestart','scanline',
      'case_sensitive','level_select','continue_is_level_select','level_select_lock','settings', 'runtime_metadata_twiddling', 'runtime_metadata_twiddling_debug', 'smoothscreen_debug','skip_title_screen','nokeyboard'];
    var keyword_array = ['checkpoint','objects', 'collisionlayers', 'legend', 'sounds', 'rules', '...','winconditions', 'levels','|','[',']','up', 'down', 'left', 'right', 'late','rigid', '^','v','\>','\<','no','randomdir','random', 'horizontal', 'vertical','any', 'all', 'no', 'some', 'moving','stationary','parallel','perpendicular','action','nosave','message','global','zoomscreen','flickscreen','smoothscreen','noundo','norestart','background_color','text_color','goto','message_text_align'];

    //  var keywordRegex = new RegExp("\\b(("+cons.join(")|(")+"))$", 'i');

    var fullSpriteMatrix = [
        '00000',
        '00000',
        '00000',
        '00000',
        '00000'
    ];

    return {
        copyState: function(state) {
            var objectsCopy = {};
            for (var i in state.objects) {
              if (state.objects.hasOwnProperty(i)) {
                var o = state.objects[i];
                objectsCopy[i] = {
                  colors: o.colors.concat([]),
                  lineNumber : o.lineNumber,
                  spritematrix: o.spritematrix.concat([])
                }
              }
            }

            var collisionLayersCopy = [];
            for (var i = 0; i < state.collisionLayers.length; i++) {
              collisionLayersCopy.push(state.collisionLayers[i].concat([]));
            }

            var legend_synonymsCopy = [];
            var legend_aggregatesCopy = [];
            var legend_propertiesCopy = [];
            var soundsCopy = [];
            var levelsCopy = [];
            var winConditionsCopy = [];

            for (var i = 0; i < state.legend_synonyms.length; i++) {
              legend_synonymsCopy.push(state.legend_synonyms[i].concat([]));
            }
            for (var i = 0; i < state.legend_aggregates.length; i++) {
              legend_aggregatesCopy.push(state.legend_aggregates[i].concat([]));
            }
            for (var i = 0; i < state.legend_properties.length; i++) {
              legend_propertiesCopy.push(state.legend_properties[i].concat([]));
            }
            for (var i = 0; i < state.sounds.length; i++) {
              soundsCopy.push(state.sounds[i].concat([]));
            }
            for (var i = 0; i < state.levels.length; i++) {
              levelsCopy.push(state.levels[i].concat([]));
            }
            for (var i = 0; i < state.winconditions.length; i++) {
              winConditionsCopy.push(state.winconditions[i].concat([]));
            }

            var original_case_namesCopy = Object.assign({},state.original_case_names);
            
            var nstate = {
              lineNumber: state.lineNumber,

              objects: objectsCopy,
              collisionLayers: collisionLayersCopy,

              commentLevel: state.commentLevel,
              section: state.section,
              visitedSections: state.visitedSections.concat([]),

              objects_candname: state.objects_candname,
              objects_section: state.objects_section,
              objects_spritematrix: state.objects_spritematrix.concat([]),

              tokenIndex: state.tokenIndex,
              currentSection: state.currentSection,

              legend_synonyms: legend_synonymsCopy,
              legend_aggregates: legend_aggregatesCopy,
              legend_properties: legend_propertiesCopy,

              sounds: soundsCopy,

              rules: state.rules.concat([]),

              names: state.names.concat([]),

              winconditions: winConditionsCopy,

              original_case_names : original_case_namesCopy,

              abbrevNames: state.abbrevNames.concat([]),

              metadata : state.metadata.concat([]),

              sprite_size : state.sprite_size,

              case_sensitive : state.case_sensitive,

              levels: levelsCopy,

              STRIDE_OBJ : state.STRIDE_OBJ,
              STRIDE_MOV : state.STRIDE_MOV
            };

            return nstate;        
        },
        blankLine: function(state) {
            if (state.section === 'levels') {
                    if (state.levels[state.levels.length - 1].length > 0)
                    {
                        state.levels.push([]);
                    }
            }
        },
        token: function(stream, state) {
           	var mixedCase = stream.string;
            var sol = stream.sol();
            if (sol) {
                if(!state.case_sensitive) {
                    stream.string = stream.string.toLowerCase();
                }
                state.tokenIndex=0;
                /*   if (state.lineNumber==undefined) {
                        state.lineNumber=1;
                }
                else {
                    state.lineNumber++;
                }*/

            }

            function registerOriginalCaseName(candname){

                function escapeRegExp(str) {
                  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
                }

                var nameFinder;
                if(state.case_sensitive) {
                    nameFinder = new RegExp("\\b"+escapeRegExp(candname)+"\\b");
                } else {
                    nameFinder = new RegExp("\\b"+escapeRegExp(candname)+"\\b","i");
                }
                
                var match = mixedCase.match(nameFinder);
                if (match!=null){
                    state.original_case_names[candname] = match[0];
                }
            }

            stream.eatWhile(/[ \t]/);

            ////////////////////////////////
            // COMMENT PROCESSING BEGIN
            ////////////////////////////////

            //NESTED COMMENTS
            var ch = stream.peek();
            if (ch === '(' && state.tokenIndex !== -4) { // tokenIndex -4 indicates message command
                stream.next();
                state.commentLevel++;
            } else if (ch === ')') {
                stream.next();
                if (state.commentLevel > 0) {
                    state.commentLevel--;
                    if (state.commentLevel === 0) {
                        return 'comment';
                    }
                }
            }
            if (state.commentLevel > 0) {
                while (true) {
                    stream.eatWhile(/[^\(\)]+/);

                    if (stream.eol()) {
                        break;
                    }

                    ch = stream.peek();

                    if (ch === '(') {
                        state.commentLevel++;
                    } else if (ch === ')') {
                        state.commentLevel--;
                    }
                    stream.next();

                    if (state.commentLevel === 0) {
                        break;
                    }
                }
                return 'comment';
            }

            stream.eatWhile(/[ \t]/);

            if (sol && stream.eol()) {
                return blankLineHandle(state);
            }

            //  if (sol)
            {

                //MATCH '==="s AT START OF LINE
                if (sol && stream.match(reg_equalsrow, true)) {
                    return 'EQUALSBIT';
                }

                //MATCH SECTION NAME
                if (sol && stream.match(reg_sectionNames, true)) {
                    state.section = stream.string.slice(0, stream.pos).trim().toLowerCase();
                    if (state.visitedSections.indexOf(state.section) >= 0) {
                        logError('cannot duplicate sections (you tried to duplicate \"' + state.section + '").', state.lineNumber);
                    }
                    state.visitedSections.push(state.section);
                    var sectionIndex = sectionNames.indexOf(state.section);
                    if (sectionIndex == 0) {
                        state.objects_section = 0;
                        if (state.visitedSections.length > 1) {
                            logError('section "' + state.section + '" must be the first section', state.lineNumber);
                        }
                    } else if (state.visitedSections.indexOf(sectionNames[sectionIndex - 1]) == -1) {
                        if (sectionIndex===-1) {
                            logError('no such section as "' + state.section + '".', state.lineNumber);
                        } else {
                            logError('section "' + state.section + '" is out of order, must follow  "' + sectionNames[sectionIndex - 1] + '".', state.lineNumber);                            
                        }
                    }

                    if (state.section === 'sounds') {
                        //populate names from rules
                        for (var n in state.objects) {
                            if (state.objects.hasOwnProperty(n)) {
/*                                if (state.names.indexOf(n)!==-1) {
                                    logError('Object "'+n+'" has been declared to be multiple different things',state.objects[n].lineNumber);
                                }*/
                                state.names.push(n);
                            }
                        }
                        //populate names from legends
                        for (var i = 0; i < state.legend_synonyms.length; i++) {
                            var n = state.legend_synonyms[i][0];
                            /*
                            if (state.names.indexOf(n)!==-1) {
                                logError('Object "'+n+'" has been declared to be multiple different things',state.legend_synonyms[i].lineNumber);
                            }
                            */
                            state.names.push(n);
                        }
                        for (var i = 0; i < state.legend_aggregates.length; i++) {
                            var n = state.legend_aggregates[i][0];
                            /*
                            if (state.names.indexOf(n)!==-1) {
                                logError('Object "'+n+'" has been declared to be multiple different things',state.legend_aggregates[i].lineNumber);
                            }
                            */
                            state.names.push(n);
                        }
                        for (var i = 0; i < state.legend_properties.length; i++) {
                            var n = state.legend_properties[i][0];
                            /*
                            if (state.names.indexOf(n)!==-1) {
                                logError('Object "'+n+'" has been declared to be multiple different things',state.legend_properties[i].lineNumber);
                            }                           
                            */ 
                            state.names.push(n);
                        }
                    }
                    else if (state.section === 'levels') {
                        //populate character abbreviations
                        for (var n in state.objects) {
                            if (state.objects.hasOwnProperty(n) && n.length == 1) {
                                state.abbrevNames.push(n);
                            }
                        }

                        for (var i = 0; i < state.legend_synonyms.length; i++) {
                            if (state.legend_synonyms[i][0].length == 1) {
                                state.abbrevNames.push(state.legend_synonyms[i][0]);
                            }
                        }
                        for (var i = 0; i < state.legend_aggregates.length; i++) {
                            if (state.legend_aggregates[i][0].length == 1) {
                                state.abbrevNames.push(state.legend_aggregates[i][0]);
                            }
                        }
                    }
                    return 'HEADER';
                } else {
                    if (state.section === undefined) {
                        logError('must start with section "OBJECTS"', state.lineNumber);
                    }
                }

                if (stream.eol()) {
                    return null;
                }

                //if color is set, try to set matrix
                //if can't set matrix, try to parse name
                //if color is not set, try to parse color
                switch (state.section) {
                case 'objects':
                    {
						var tryParseName = function() {
                            //LOOK FOR NAME
                            var match_name = sol ? stream.match(reg_name, true) : stream.match(/[^\p{Z}\s\()]+[\p{Z}\s]*/u,true);
                            if (match_name == null) {
                                stream.match(reg_notcommentstart, true);
                                if (stream.pos>0){                                
                                    logWarning('Unknown junk in object section (possibly: the main names for objects have to be words containing only the letters a-z0.9 - if you want to call them something like ",", do it in the legend section).',state.lineNumber);
                                }
                                return 'ERROR';
                            } else {
                                var candname = match_name[0].trim();
                                if (state.objects[candname] !== undefined) {
                                    logError('Object "' + candname + '" defined multiple times.', state.lineNumber);
                                    return 'ERROR';
                                }
                                for (var i=0;i<state.legend_synonyms.length;i++) {
                                	var entry = state.legend_synonyms[i];
                                	if (entry[0]==candname) {
                                    	logError('Name "' + candname + '" already in use.', state.lineNumber);                                		
                                	}
                                }
                                if (keyword_array.indexOf(candname)>=0) {
                                    logWarning('You named an object "' + candname + '", but this is a keyword. Don\'t do that!', state.lineNumber);
                                }

                                if (sol) {
                                	state.objects_candname = candname;
                                    registerOriginalCaseName(candname);
                                	state.objects[state.objects_candname] = {
										                                	lineNumber: state.lineNumber,
										                                	colors: [],
                                                                            spritematrix: [],
                                                                            cloneSprite: ""
										                                };

								} else {
                                    //console.log(candname +" == "+ state.objects_candname);
                                    if (candname.substring(0, 5) == "copy:" && candname.length > 5) {
                                        var cloneName = candname.substring(5);
                                        if (state.objects[state.objects_candname].cloneSprite != "") {
                                            logError("You already assigned a sprite parent for " + cloneName + ", you can't have more than one!", state.lineNumber);
                                            return 'ERROR';
                                        } else if (cloneName == state.objects_candname) {
                                            logError("You attempted to set the sprite parent for " + cloneName + " to " + cloneName + "! Please don't, and keep the recursion in check.", state.lineNumber)
                                            return 'ERROR';
                                        } else {
                                            state.objects[state.objects_candname].cloneSprite = cloneName;
                                            //state.objects_section = 1;
                                            return "SPRITEPARENT";
                                        }
                                    }
									//set up alias
                                    registerOriginalCaseName(candname);
									var synonym = [candname,state.objects_candname];
									synonym.lineNumber = state.lineNumber;
									state.legend_synonyms.push(synonym);
                                }
                                
                                if(state.case_sensitive) {
                                    if((candname.toLowerCase() == "player" && candname != "player") || (candname.toLowerCase() == "background" && candname != "background")) {
                                        // setup aliases for special objects
                                        var synonym = [candname.toLowerCase(),state.objects_candname];
                                        synonym.lineNumber = state.lineNumber;
                                        state.legend_synonyms.push(synonym);
                                    }
                                }

                                state.objects_section = 1;
                                return 'NAME';
                            }
                        };

                        if (sol && state.objects_section == 2) {
                            state.objects_section = 3;
                        }

                        if (sol && state.objects_section == 1) {
                            state.objects_section = 2;
                        }

                        switch (state.objects_section) {
                        case 0:
                        case 1:
                            {
                                state.objects_spritematrix = [];
                                return tryParseName();
                                break;
                            }
                        case 2:
                            {
                                //LOOK FOR COLOR
                                stream.string = stream.string.toLowerCase();
                                state.tokenIndex = 0;

                                var match_color = stream.match(reg_color, true);
                                if (match_color == null) {
                                    var str = stream.match(reg_name, true) || stream.match(reg_notcommentstart, true);
                                    logError('Was looking for color for object ' + state.objects_candname + ', got "' + str + '" instead.', state.lineNumber);
                                    return null;
                                } else {
                                    if (state.objects[state.objects_candname].colors === undefined) {
                                        state.objects[state.objects_candname].colors = [match_color[0].trim()];
                                    } else {
                                        state.objects[state.objects_candname].colors.push(match_color[0].trim());
                                    }

                                    var candcol = match_color[0].trim().toLowerCase();
                                    if (candcol in colorPalettes.arnecolors) {
                                        return 'COLOR COLOR-' + candcol.toUpperCase();
                                    } else if (candcol==="transparent") {
                                        return 'COLOR FADECOLOR';
                                    } else {
                                        return 'MULTICOLOR'+match_color[0];
                                    }
                                }
                                break;
                            }
                        case 3:
                            {
                                var ch = stream.eat(/[.\d]/);
                                var spritematrix = state.objects_spritematrix;
                                if (ch === undefined) {
                                    if (spritematrix.length === 0) {
                                        return tryParseName();
                                    }
                                    logError('Unknown junk in spritematrix for object ' + state.objects_candname + '.', state.lineNumber);
                                    stream.match(reg_notcommentstart, true);
                                    return null;
                                }

                                if (sol) {
                                    spritematrix.push('');
                                }

                                var o = state.objects[state.objects_candname];

                                spritematrix[spritematrix.length - 1] += ch;
                                if (spritematrix[spritematrix.length-1].length>state.sprite_size){
                                    logError('Sprites must be ' + state.sprite_size + ' wide and ' + state.sprite_size + ' high.', state.lineNumber);
                                    stream.match(reg_notcommentstart, true);
                                    return null;
                                }
                                o.spritematrix = state.objects_spritematrix;
                                if (spritematrix.length === state.sprite_size && spritematrix[spritematrix.length - 1].length == state.sprite_size) {
                                    state.objects_section = 0;
                                }

                                if (ch!=='.') {
                                    var n = parseInt(ch);
                                    if (n>=o.colors.length) {
                                        logError("Trying to access color number "+n+" from the color palette of sprite " +state.objects_candname+", but there are only "+o.colors.length+" defined in it.",state.lineNumber);
                                        return 'ERROR';
                                    }
                                    if (isNaN(n)) {
                                        logError('Invalid character "' + ch + '" in sprite for ' + state.objects_candname, state.lineNumber);
                                        return 'ERROR';
                                    }
                                    return 'COLOR BOLDCOLOR COLOR-' + o.colors[n].toUpperCase();
                                }
                                return 'COLOR FADECOLOR';
                            }
                        default:
                        	{
                        	window.console.logError("EEK shouldn't get here.");
                        	}
                        }
                        break;
                    }
                case 'sounds':
                    {
                        if (sol) {
                            var ok = true;
                            var splits = reg_notcommentstart.exec(stream.string)[0].split(/[\p{Z}\s]/u).filter(function(v) {return v !== ''});                          
                            splits.push(state.lineNumber);
                            state.sounds.push(splits);
                        }
                        candname = stream.match(reg_soundverbs, true);
                        if (candname!==null) {
                        	return 'SOUNDVERB';
                        }
                        candname = stream.match(reg_sounddirectionindicators,true);
                        if (candname!==null) {
                        	return 'DIRECTION';
                        }
                        candname = stream.match(reg_soundseed, true);
                        if (candname !== null)
                        {
                            state.tokenIndex++;
                            return 'SOUND';
                        } 
                       	candname = stream.match(/[^\[\|\]\p{Z}\s]*/u, true);
                       	if (candname!== null ) {
                       		var m = candname[0].trim();
                       		if (state.names.indexOf(m)>=0) {
                       			return 'NAME';
                       		}
                       	} else {
                            //can we ever get here?
                            candname = stream.match(reg_notcommentstart, true);
                        }
                        logError('unexpected sound token "'+candname+'".' , state.lineNumber);
                        stream.match(reg_notcommentstart, true);
                        return 'ERROR';
                        break;
                    }
                case 'collisionlayers':
                    {
                        if (sol) {
                            //create new collision layer
                            state.collisionLayers.push([]);
                            state.tokenIndex=0;
                        }

                        var match_name = stream.match(reg_name, true);
                        if (match_name === null) {
                            //then strip spaces and commas
                            var prepos=stream.pos;
                            stream.match(reg_csv_separators, true);
                            if (stream.pos==prepos) {
                                logError("error detected - unexpected character " + stream.peek(),state.lineNumber);
                                stream.next();
                            }
                            return null;
                        } else {
                            //have a name: let's see if it's valid
                            var candname = match_name[0].trim();

                            var substitutor = function(n) {
                                if(!state.case_sensitive) {
                                    n = n.toLowerCase();
                                }
                            	if (n in state.objects) {
                            		return [n];
                            	} 


                                for (var i=0;i<state.legend_synonyms.length;i++) {
                                    var a = state.legend_synonyms[i];
                                    if (a[0]===n) {           
                                        return substitutor(a[1]);
                                    }
                                }

                            	for (var i=0;i<state.legend_aggregates.length;i++) {
                            		var a = state.legend_aggregates[i];
                            		if (a[0]===n) {           
                            			logError('"'+n+'" is an aggregate (defined using "and"), and cannot be added to a single layer because its constituent objects must be able to coexist.', state.lineNumber);
                            			return [];         
                            		}
                            	}
                            	for (var i=0;i<state.legend_properties.length;i++) {
                            		var a = state.legend_properties[i];
                            		if (a[0]===n) {  
                                        var result = [];
                                        for (var j=1;j<a.length;j++){
                                            if (a[j]===n){
                                                //error here superfluous, also detected elsewhere (cf 'You can't define object' / #789)
                                                //logError('Error, recursive definition found for '+n+'.', state.lineNumber);                                
                                            } else {
                                                result = result.concat(substitutor(a[j]));
                                            }
                                        }
                            			return result;
                            		}
                            	}
                            	logError('Cannot add "' + candname + '" to a collision layer; it has not been declared.', state.lineNumber);                                
                            	return [];
                            };
                            if (candname.toLowerCase()==='background' ) {
                                if (state.collisionLayers.length>0&&state.collisionLayers[state.collisionLayers.length-1].length>0) {
                                    logError("Background must be in a layer by itself.",state.lineNumber);
                                }
                                state.tokenIndex=1;
                            } else if (state.tokenIndex!==0) {
                                logError("Background must be in a layer by itself.",state.lineNumber);
                            }

                            var ar = substitutor(candname);

                            if (state.collisionLayers.length===0) {
                                logError("no layers found.",state.lineNumber);
                                return 'ERROR';
                            }
                            
                            var foundOthers=[];
                            for (var i=0;i<ar.length;i++){
                                var candname = ar[i];
                                for (var j=0;j<=state.collisionLayers.length-1;j++){
                                    var clj = state.collisionLayers[j];
                                    if (clj.indexOf(candname)>=0){
                                        if (j!=state.collisionLayers.length-1){
                                            foundOthers.push(j);
                                        }
                                    }
                                }
                            }
                            if (foundOthers.length>0){
                                var warningStr = 'Object "'+candname+'" included in multiple collision layers ( layers ';
                                for (var i=0;i<foundOthers.length;i++){
                                    warningStr+="#"+(foundOthers[i]+1)+", ";
                                }
                                warningStr+="#"+state.collisionLayers.length;
                                logWarning(warningStr +' ). You should fix this!',state.lineNumber);                                        
                            }

                            state.collisionLayers[state.collisionLayers.length - 1] = state.collisionLayers[state.collisionLayers.length - 1].concat(ar);
                            if (ar.length>0) {
                            	return 'NAME';                            
                            } else {
                            	return 'ERROR';
                            }
                        }
                        break;
                    }
                case 'legend':
                    {
                        if (sol) {


                            //step 1 : verify format
                            var longer = stream.string.replace('=', ' = ');
                            longer = reg_notcommentstart.exec(longer)[0];

                            var splits = longer.split(/[\p{Z}\s]/u).filter(function(v) {
                                return v !== '';
                            });
                            var ok = true;

                        	if (splits.length>0) {
                                var candname = splits[0];
                                if(!state.case_sensitive) {
                                    candname = candname.toLowerCase();
                                }
                                
	                            if (keyword_array.indexOf(candname)>=0) {
	                                logWarning('You named an object "' + candname + '", but this is a keyword. Don\'t do that!', state.lineNumber);
	                            }
                                if (splits.indexOf(candname, 2)>=2) {
                                    logError("You can't define object " + candname.toUpperCase() + " in terms of itself!", state.lineNumber);
                                    var idx = splits.indexOf(candname, 2);
                                    while (idx >=2){
                                        if (idx>=4){
                                            splits.splice(idx-1, 2);
                                        } else {
                                            splits.splice(idx, 2);
                                        }
                                        idx = splits.indexOf(candname, 2);
                                    }

                                    // ok = false;
                                }
                                checkNameNew(state,candname);
                        	}

                            if (!ok) {
                            } else if (splits.length < 3) {
                                ok = false;
                            } else if (splits[1] !== '=') {
                                ok = false;
                            } /*else if (splits[0].charAt(splits[0].length - 1) == 'v') {
                                logError('names cannot end with the letter "v", because it\'s is used as a direction.', state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';
                            } */ else if (splits.length === 3) {
                                var synonym = [splits[0], splits[2]];
                                if(!state.case_sensitive) {
                                    synonym[1] = synonym[1].toLowerCase();
                                }

                                synonym.lineNumber = state.lineNumber;

                                registerOriginalCaseName(splits[0]);
                                state.legend_synonyms.push(synonym);
                            } else if (splits.length % 2 === 0) {
                                ok = false;
                            } else {
                                var lowertoken = splits[3].toLowerCase();
                                if (lowertoken === 'and') {

	                                var substitutor = function(n) {
                                        if(!state.case_sensitive) {
                                            n = n.toLowerCase();
                                        }
	                                	if (n in state.objects) {
	                                		return [n];
	                                	} 
	                                	for (var i=0;i<state.legend_synonyms.length;i++) {
	                                		var a = state.legend_synonyms[i];
	                                		if (a[0]===n) {   
	                                			return substitutor(a[1]);
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_aggregates.length;i++) {
	                                		var a = state.legend_aggregates[i];
	                                		if (a[0]===n) {                                			
	                                			return [].concat.apply([],a.slice(1).map(substitutor));
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_properties.length;i++) {
	                                		var a = state.legend_properties[i];
	                                		if (a[0]===n) {         
	                                			logError("Cannot define an aggregate (using 'and') in terms of properties (something that uses 'or').", state.lineNumber);
	                                			ok=false;
	                                			return [n];
	                                		}
	                                	}
	                                	return [n];
	                                };

                                    for (var i = 5; i < splits.length; i += 2) {
                                        if (splits[i].toLowerCase() !== 'and') {
                                            ok = false;
                                            break;
                                        }
                                    }
                                    if (ok) {
                                        var newlegend = [splits[0]].concat(substitutor(splits[2])).concat(substitutor(splits[4]));
                                        for (var i = 6; i < splits.length; i += 2) {
                                            newlegend = newlegend.concat(substitutor(splits[i]));
                                        }
                                        newlegend.lineNumber = state.lineNumber;

                                        registerOriginalCaseName(newlegend[0]);
                                        state.legend_aggregates.push(newlegend);
                                    }
                                } else if (lowertoken === 'or') {

	                                var substitutor = function(n) {
                                        if(!state.case_sensitive) {
                                            n = n.toLowerCase();
                                        }

	                                	if (n in state.objects) {
	                                		return [n];
	                                	} 

	                                	for (var i=0;i<state.legend_synonyms.length;i++) {
	                                		var a = state.legend_synonyms[i];
	                                		if (a[0]===n) {   
	                                			return substitutor(a[1]);
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_aggregates.length;i++) {
	                                		var a = state.legend_aggregates[i];
	                                		if (a[0]===n) {           
	                                			logError("Cannot define a property (using 'or') in terms of aggregates (something that uses 'and').", state.lineNumber);
	                                			ok=false;          
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_properties.length;i++) {
	                                		var a = state.legend_properties[i];
	                                		if (a[0]===n) {  
                                                var result = [];
                                                for (var j=1;j<a.length;j++){
                                                    if (a[j]===n){
                                                        //error here superfluous, also detected elsewhere (cf 'You can't define object' / #789)
                                                        //logError('Error, recursive definition found for '+n+'.', state.lineNumber);                                
                                                    } else {
                                                        result = result.concat(substitutor(a[j]));
                                                    }
                                                }
                                                return result;
                                            }
	                                	}
	                                	return [n];
	                                };

                                    for (var i = 5; i < splits.length; i += 2) {
                                        if (splits[i].toLowerCase() !== 'or') {
                                            ok = false;
                                            break;
                                        }
                                    }
                                    if (ok) {
                                        var newlegend = [splits[0]].concat(substitutor(splits[2])).concat(substitutor(splits[4]));
                                        for (var i = 6; i < splits.length; i += 2) {
                                            if(state.case_sensitive) {
                                                newlegend.push(splits[i]);
                                            } else {
                                                newlegend.push(splits[i].toLowerCase());
                                            }
                                        }
                                        newlegend.lineNumber = state.lineNumber;

                                        registerOriginalCaseName(newlegend[0]);
                                        state.legend_properties.push(newlegend);
                                    }
                                } else {
                                    ok = false;
                                }
                            }

                            if (ok === false) {
                                logError('incorrect format of legend - should be one of A = B, A = B or C ( or D ...), A = B and C (and D ...)', state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';
                            }

                            state.tokenIndex = 0;
                        }

                        if (state.tokenIndex === 0) {
                            stream.match(/[^=]*/, true);
                            state.tokenIndex++;
                            return 'NAME';
                        } else if (state.tokenIndex === 1) {
                            stream.next();
                            stream.match(/[\p{Z}\s]*/u, true);
                            state.tokenIndex++;
                            return 'ASSSIGNMENT';
                        } else {
                            var match_name = stream.match(reg_name, true);
                            if (match_name === null) {
                                logError("Something bad's happening in the LEGEND", state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';
                            } else {
                                var candname = match_name[0].trim();

                                if (state.tokenIndex % 2 === 0) {

	                                var wordExists = function(n) {
                                        if(!state.case_sensitive) {
                                            n = n.toLowerCase();
                                        }

	                                	if (n in state.objects) {
	                                		return true;
	                                	} 
	                                	for (var i=0;i<state.legend_aggregates.length;i++) {
	                                		var a = state.legend_aggregates[i];
	                                		if (a[0]===n) {                                			
	                                			return true;
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_properties.length;i++) {
	                                		var a = state.legend_properties[i];
	                                		if (a[0]===n) {  
	                                			return true;
	                                		}
	                                	}
	                                	for (var i=0;i<state.legend_synonyms.length;i++) {
	                                		var a = state.legend_synonyms[i];
	                                		if (a[0]===n) {  
	                                			return true;
	                                		}
	                                	}
	                                	return false;
	                                };


                                    if (wordExists(candname)===false) {
                                            logError('Cannot reference "' + candname + '" in the LEGEND section; it has not been defined yet.', state.lineNumber);
                                            state.tokenIndex++;
                                            return 'ERROR';
                                    } else {
                                            state.tokenIndex++;
                                            return 'NAME';
                                    }
                                } else {
                                        state.tokenIndex++;
                                        return 'LOGICWORD';
                                }
                            }
                        }
                        break;
                    }
                case 'rules':
                    {                    	
                        if (sol) {
                            var rule = reg_notcommentstart.exec(stream.string)[0];
                            state.rules.push([rule, state.lineNumber, mixedCase]);
                            state.tokenIndex = 0;//in rules, records whether bracket has been found or not
                        }

                        if (state.tokenIndex===-4) {
                        	stream.skipToEnd();
                        	return 'MESSAGE';
                        }
                        if (stream.match(/[\p{Z}\s]*->[\p{Z}\s]*/u, true)) {
                            return 'ARROW';
                        }
                        if (ch === '[' || ch === '|' || ch === ']' || ch==='+') {
                        	if (ch!=='+') {
                            	state.tokenIndex = 1;
                            }
                            stream.next();
                            stream.match(/[\p{Z}\s]*/u, true);
                            return 'BRACKET';
                        } else {
                            var m = stream.match(/[^\[\|\]\p{Z}\s]*/u, true)[0].trim();

                            if (state.tokenIndex===0&&reg_loopmarker.exec(m)) {
                            	return 'BRACKET';
                            } else if (state.tokenIndex === 0 && reg_ruledirectionindicators.exec(m)) {
                                stream.match(/[\p{Z}\s]*/u, true);
                                return 'DIRECTION';
                            } else if (state.tokenIndex === 1 && reg_directions.exec(m)) {
                                stream.match(/[\p{Z}\s]*/u, true);
                                return 'DIRECTION';
                            } else {
                                if (state.names.indexOf(m) >= 0) {
                                    if (sol) {
                                        logError('Identifiers cannot appear outside of square brackets in rules, only directions can.', state.lineNumber);
                                        return 'ERROR';
                                    } else {
                                        stream.match(/[\p{Z}\s]*/u, true);
                                        return 'NAME';
                                    }
                                }
                                
                                m = m.toLowerCase();
                                if (m==='...') {
                                    return 'DIRECTION';
                                } else if (m==='rigid') {
                                    return 'DIRECTION';
                                } else if (m==='random') {
                                    return 'DIRECTION';
                                } else if (m==='global') {
                                    return 'DIRECTION';
                                }else if (commandwords.indexOf(m)>=0) {
									if (m==='message' || m==='goto' || twiddleable_params.includes(m)) {
										state.tokenIndex=-4;
									}                                	
                                	return 'COMMAND';
                                } else {
                                    logError('Name "' + m + '", referred to in a rule, does not exist.', state.lineNumber);
                                    return 'ERROR';
                                }
                            }
                        }

                        break;
                    }
                case 'winconditions':
                    {
                        if (sol) {
                        	var tokenized = reg_notcommentstart.exec(stream.string);
                        	var splitted = tokenized[0].split(/[\p{Z}\s]/u);
                        	var filtered = splitted.filter(function(v) {return v !== ''});
                            filtered.push(state.lineNumber);
                            
                            state.winconditions.push(filtered);
                            state.tokenIndex = -1;
                        }
                        state.tokenIndex++;

                        var match = stream.match(/[\p{Z}\s]*[\p{L}\p{N}_]+[\p{Z}\s]*/u);
                        if (match === null) {
                                logError('incorrect format of win condition.', state.lineNumber);
                                stream.match(reg_notcommentstart, true);
                                return 'ERROR';

                        } else {
                            var candword = match[0].trim();
                            if (state.tokenIndex === 0) {
                                if (reg_winconditionquantifiers.exec(candword)) {
                                    return 'LOGICWORD';
                                }
                                else {
                                    return 'ERROR';
                                }
                            }
                            else if (state.tokenIndex === 2) {
                                if (candword.toLowerCase() != 'on') {
                                    logError('Expecting the word "ON" but got "'+candword.toUpperCase()+"'.", state.lineNumber);
                                    return 'ERROR';
                                } else {
                                    return 'LOGICWORD';
                                }
                            }
                            else if (state.tokenIndex === 1 || state.tokenIndex === 3) {
                                if (state.names.indexOf(candword)===-1) {
                                    logError('Error in win condition: "' + candword + '" is not a valid object name.', state.lineNumber);
                                    return 'ERROR';
                                } else {
                                    return 'NAME';
                                }
                            }
                        }
                        break;
                    }
                case 'levels':
                    {
                        if (sol)
                        {
                            if (stream.match(/[\p{Z}\s]*message\b[\p{Z}\s]*/ui, true)) {
                                state.tokenIndex = 1;//1/2/3/4 = message/level/section/goto
                                var newdat = ['message', mixedCase.slice(stream.pos).trim(), state.lineNumber, state.currentSection];
                                if (state.levels[state.levels.length - 1].length == 0) {
                                    state.levels.splice(state.levels.length - 1, 0, newdat);
                                } else {
                                    state.levels.push(newdat);
                                }
                                return 'MESSAGE_VERB';//a duplicate of the previous section as a legacy thing for #589 
                            } else if (stream.match(/[\p{Z}\s]*message[\p{Z}\s]*/ui, true)) {//duplicating previous section because of #589
                                logWarning("You probably meant to put a space after 'message' innit.  That's ok, I'll still interpret it as a message, but you probably want to put a space there.",state.lineNumber);
								state.tokenIndex = 1;//1/2/3/4 = message/level/section/goto
                                var newdat = ['message', mixedCase.slice(stream.pos).trim(), state.lineNumber, state.currentSection];
                                if (state.levels[state.levels.length - 1].length == 0) {
                                    state.levels.splice(state.levels.length - 1, 0, newdat);
                                } else {
                                    state.levels.push(newdat);
                                }
                                return 'MESSAGE_VERB';
                            } else if (stream.match(/\s*section\s*/i, true)) {
                                state.tokenIndex = 3;//1/2/3/4 = message/level/section/goto
                                state.currentSection = mixedCase.slice(stream.pos).trim();
                                return 'SECTION_VERB';
                            } else if (stream.match(/\s*goto\s*/i, true)) {
                                state.tokenIndex = 4;//1/2/3/4 = message/level/section/goto
                                var newdat = ['goto', mixedCase.slice(stream.pos).trim(), state.lineNumber, state.currentSection];
                                if (state.levels[state.levels.length - 1].length == 0) {
                                    state.levels.splice(state.levels.length - 1, 0, newdat);
                                } else {
                                    state.levels.push(newdat);
                                }
                                return 'GOTO_VERB';
                            } else {
                                var matches = stream.match(reg_notcommentstart, false);
                                if (matches===null || matches.length===0){
                                    logError("Detected a comment where I was expecting a level. Oh gosh; if this is to do with you using '(' as a character in the legend, please don't do that ^^",state.lineNumber);
                                    state.commentLevel++;
                                    stream.skipToEnd();
                                    return 'comment';
                                } else {
                                    var line = matches[0].trim();
                                    state.tokenIndex = 2;
                                    var lastlevel = state.levels[state.levels.length - 1];
                                    if (lastlevel[0] == '\n') {
                                        state.levels.push([state.lineNumber, state.currentSection, line]);
                                    } else {
                                        if (lastlevel.length==0)
                                        {
                                            lastlevel.push(state.lineNumber);
                                            lastlevel.push(state.currentSection);
                                    }
                                        lastlevel.push(line);

                                        if (lastlevel.length>2)
                                        {
                                            if (line.length!=lastlevel[2].length) {
                                                logWarning("Maps must be rectangular, yo (In a level, the length of each row must be the same).",state.lineNumber);
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            if (state.tokenIndex == 1) {
                                stream.skipToEnd();
                               	return 'MESSAGE';
                            } else if (state.tokenIndex == 3) {
                                stream.skipToEnd();
                                return 'SECTION';
                            } else if (state.tokenIndex == 4) {
                                stream.skipToEnd();
                                return 'GOTO';
                            }
                        }

                        if (state.tokenIndex === 2 && !stream.eol()) {
                            var ch = stream.peek();
                            stream.next();
                            if (state.abbrevNames.indexOf(ch) >= 0) {
                                return 'LEVEL';
                            } else {
                                logError('Key "' + ch + '" not found. Do you need to add it to the legend, or define a new object?', state.lineNumber);
                                return 'ERROR';
                            }
                        }
                        break;
                    }
	                
	                default://if you're in the preamble
	                {
	            		if (sol) {
	            			state.tokenIndex=0;
	            		}
	            		if (state.tokenIndex==0) {
		                    var match = stream.match(/[\p{Z}\s]*[\p{L}\p{N}_]+[\p{Z}\s]*/u);	                    
		                    if (match!==null) {
		                    	var token = match[0].trim();
		                    	if (sol) {
		                    		if (preamble_params.indexOf(token)>=0) {
		                    			
                                        if (token==='youtube' || token==='author' || token==='homepage' || token==='title' || token==='custom_font' || token==='text_controls' || token==='text_message_continue') {
                                            stream.string=mixedCase;
                                        }
                                        
                                        var m2 = stream.match(reg_notcommentstart, false);
                                        
		                    			if(m2!=null) {
                                            if(token=='sprite_size') {
                                                state.sprite_size = parseInt(m2[0].trim(), 10);
                                            } else {
                                                state.metadata.push(token);
                                                state.metadata.push(m2[0].trim());
                                            }
		                    			} else {
		                    				logError('MetaData "'+token+'" needs a value.',state.lineNumber);
		                    			}
		                    			state.tokenIndex=1;
		                    			return 'METADATA';
		                    		} else if (preamble_keywords.indexOf(token)>=0) {
                                        if(token == 'case_sensitive') {
                                            state.case_sensitive = true;
                                            
                                            if (Object.keys(state.metadata).length > 0) {
                                                logWarningNoLine("[PS+] Please make sure that CASE_SENSITIVE is your topmost prelude flag. Sometimes this fixes errors with other prelude flags.", false, false)
                                            }
                                        }

                                        state.metadata.push(token);
		                    			state.metadata.push("true");
		                    			state.tokenIndex=-1;
		                    			return 'METADATA';
		                    		} else  {
		                    			logError('Unrecognised stuff in the prelude.', state.lineNumber);
		                    			return 'ERROR';
		                    		}
		                    	} else if (state.tokenIndex==-1) {
	                   				logError('MetaData "'+token+'" has no parameters.',state.lineNumber);
		                    		return 'ERROR';
		                    	}
		                    	return 'METADATA';
		                    }       
		               	} else {
		               		stream.match(reg_notcommentstart, true);
		               		return "METADATATEXT";
		               	}
	                	break;
	                }
	            }
            };

            if (stream.eol()) {
                return null;
            }
            if (!stream.eol()) {
                stream.next();
                return null;
            }
        },
        startState: function() {
            return {
                /*
                    permanently useful
                */
                objects: {},

                /*
                    for parsing
                */
                lineNumber: 0,

                commentLevel: 0,

                section: '',
                visitedSections: [],

                objects_candname: '',
                objects_section: 0, //whether reading name/color/spritematrix
                objects_spritematrix: [],

                collisionLayers: [],

                tokenIndex: 0,

                currentSection: null,

                legend_synonyms: [],
                legend_aggregates: [],
                legend_properties: [],

                sounds: [],
                rules: [],

                names: [],

                winconditions: [],
                metadata: [],

                sprite_size: 5,

                case_sensitive: false,

                original_case_names: {},

                abbrevNames: [],

                levels: [[]],

                subsection: ''
            };
        }
    };
};

window.CodeMirror.defineMode('puzzle', codeMirrorFn);

// @@end js/parser.js


// @@begin js/editor.js
var code = document.getElementById('code');
var _editorDirty = false;
var _editorCleanState = "";

var fileToOpen=getParameterByName("demo");
if (fileToOpen!==null&&fileToOpen.length>0) {
	tryLoadFile(fileToOpen);
	code.value = "loading...";
} else {
	var gistToLoad=getParameterByName("hack");
	if (gistToLoad!==null&&gistToLoad.length>0) {
		var id = gistToLoad.replace(/[\\\/]/,"");
		tryLoadGist(id);
		code.value = "loading...";
	} else {
		try {
			if (storage_has('saves')) {
					var curSaveArray = JSON.parse(storage_get('saves'));
					var sd = curSaveArray[curSaveArray.length-1];
					code.value = sd.text;
					var loadDropdown = document.getElementById('loadDropDown');
					loadDropdown.selectedIndex=0;
			}
		} catch(ex) {
			
		}
	}
}

CodeMirror.commands.swapLineUp = function(cm) {
    var ranges = cm.listSelections(), linesToMove = [], at = cm.firstLine() - 1, newSels = [];
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i], from = range.from().line - 1, to = range.to().line;
      newSels.push({anchor: CodeMirror.Pos(range.anchor.line - 1, range.anchor.ch),
                    head: CodeMirror.Pos(range.head.line - 1, range.head.ch)});
    //   if (range.to().ch == 0 && !range.empty()) --to;
      if (from > at) linesToMove.push(from, to);
      else if (linesToMove.length) linesToMove[linesToMove.length - 1] = to;
      at = to;
    }
	if (linesToMove.length===0){
		return;
	}
    cm.operation(function() {
      for (var i = 0; i < linesToMove.length; i += 2) {
        var from = linesToMove[i], to = linesToMove[i + 1];
        var line = cm.getLine(from);
        cm.replaceRange("", CodeMirror.Pos(from, 0), CodeMirror.Pos(from + 1, 0), "+swapLine");
        if (to > cm.lastLine())
          cm.replaceRange("\n" + line, CodeMirror.Pos(cm.lastLine()), null, "+swapLine");
        else
          cm.replaceRange(line + "\n", CodeMirror.Pos(to, 0), null, "+swapLine");
      }
      cm.setSelections(newSels);
      cm.scrollIntoView();
    });
  };

  CodeMirror.commands.swapLineDown = function(cm) {
    var ranges = cm.listSelections(), linesToMove = [], at = cm.lastLine() + 1;
    for (var i = ranges.length - 1; i >= 0; i--) {
      var range = ranges[i], from = range.to().line + 1, to = range.from().line;
    //   if (range.to().ch == 0 && !range.empty()) from--;
      if (from < at) linesToMove.push(from, to);
      else if (linesToMove.length) linesToMove[linesToMove.length - 1] = to;
      at = to;
    }
    cm.operation(function() {
      for (var i = linesToMove.length - 2; i >= 0; i -= 2) {
        var from = linesToMove[i], to = linesToMove[i + 1];
        var line = cm.getLine(from);
        if (from == cm.lastLine())
          cm.replaceRange("", CodeMirror.Pos(from - 1), CodeMirror.Pos(from), "+swapLine");
        else
          cm.replaceRange("", CodeMirror.Pos(from, 0), CodeMirror.Pos(from + 1, 0), "+swapLine");
        cm.replaceRange(line + "\n", CodeMirror.Pos(to, 0), null, "+swapLine");
      }
      cm.scrollIntoView();
    });
  };

var editor = window.CodeMirror.fromTextArea(code, {
//	viewportMargin: Infinity,
	lineWrapping: true,
	lineNumbers: true,
	styleActiveLine: true,
	extraKeys: {
		"Ctrl-/": "toggleComment",
		"Cmd-/": "toggleComment",
		"Esc":CodeMirror.commands.clearSearch,
		"Shift-Ctrl-Up": "swapLineUp",
		"Shift-Ctrl-Down": "swapLineDown",
		}
	});
	
editor.on('mousedown', function(cm, event) {
  if (event.target.className == 'cm-SOUND') {
    var seed = parseInt(event.target.innerHTML);
    playSound(seed);
  } else if (event.target.className == 'cm-LEVEL') {
    if (event.ctrlKey||event.metaKey) {
	  document.activeElement.blur();  // unfocus code panel
	  editor.display.input.blur();
      prevent(event);         // prevent refocus
      compile(["levelline",cm.posFromMouse(event).line]);
    }
  }
});

_editorCleanState = editor.getValue();

function checkEditorDirty() {
	var saveLink = document.getElementById('saveClickLink');

	if (_editorCleanState !== editor.getValue()) {
		_editorDirty = true;
		if(saveLink) {
			saveLink.innerHTML = 'SAVE*';
		}
	} else {
		_editorDirty = false;
		if(saveLink) {
			saveLink.innerHTML = 'SAVE';
		}
	}
}

function setEditorClean() {
	_editorCleanState = editor.getValue();
	if (_editorDirty===true) {
		var saveLink = document.getElementById('saveClickLink');
		if(saveLink) {
			saveLink.innerHTML = 'SAVE';
		}
		_editorDirty = false;
	}
}

/* https://github.com/ndrake/PuzzleScript/commit/de4ac2a38865b74e66c1d711a25f0691079a290d */
editor.on('change', function(cm, changeObj) {
  // editor is dirty
  checkEditorDirty();
});

var mapObj = {
   parallel:"&#8741;",
   perpendicular:"&#8869;"
};

/*
editor.on("beforeChange", function(instance, change) {
    var startline = 
    for (var i = 0; i < change.text.length; ++i)
      text.push(change.text[i].replace(/parallel|perpendicular/gi, function(matched){ 
        return mapObj[matched];
      }));

    change.update(null, null, text);
});*/


code.editorreference = editor;
editor.setOption('theme', 'midnight');

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function tryLoadGist(id) {
	var githubURL = 'https://api.github.com/gists/'+id;

	consolePrint("Contacting GitHub",true);
	var githubHTTPClient = new XMLHttpRequest();

	githubHTTPClient.open('GET', githubURL);
	githubHTTPClient.onreadystatechange = function() {
	 
		if(githubHTTPClient.readyState!=4) {
			return;
		}

		if (githubHTTPClient.responseText==="") {
			consoleError("GitHub request returned nothing.  A connection fault, maybe?");
		}

		var result = JSON.parse(githubHTTPClient.responseText);
		if (githubHTTPClient.status===403) {
			consoleError(result.message);
		} else if (githubHTTPClient.status!==200&&githubHTTPClient.status!==201) {
			consoleError("HTTP Error "+ githubHTTPClient.status + ' - ' + githubHTTPClient.statusText);
		} else {
			var code=result["files"]["script.txt"]["content"];
			editor.setValue(code);
			editor.clearHistory();
			clearConsole();
			setEditorClean();
			unloadGame();
			compile(["restart"],code);
		}
	}
	// if (storage_has('oauth_access_token')) {
    //     var oauthAccessToken = storage_get("oauth_access_token");
    //     if (typeof oauthAccessToken === "string") {
    //         githubHTTPClient.setRequestHeader("Authorization","token "+oauthAccessToken);
    //     }
    // }
	githubHTTPClient.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	githubHTTPClient.send();
}

function tryLoadFile(fileName) {
	var fileOpenClient = new XMLHttpRequest();
	fileOpenClient.open('GET', 'demo/'+fileName+".txt");
	fileOpenClient.onreadystatechange = function() {
		
  		if(fileOpenClient.readyState!=4) {
  			return;
  		}
  		
		editor.setValue(fileOpenClient.responseText);
		clearConsole();
		setEditorClean();
		unloadGame();
		compile(["restart"]);
	}
	fileOpenClient.send();
}

function canExit() {
 	if(!_editorDirty) {
 		return true;
 	}
 
 	return confirm("You haven't saved your game! Are you sure you want to lose your unsaved changes?")
}
 
function dropdownChange() {
	if(!canExit()) {
 		this.selectedIndex = 0;
 		return;
 	}

	tryLoadFile(this.value);
	this.selectedIndex=0;
}

editor.on('keyup', function (editor, event) {
	if (!CodeMirror.ExcludedIntelliSenseTriggerKeys[(event.keyCode || event.which).toString()])
	{
		CodeMirror.commands.autocomplete(editor, null, { completeSingle: false });
	}
});


function debugPreview(turnIndex,lineNumber){
	diffToVisualize=debug_visualisation_array[turnIndex][lineNumber];
	redraw();
}

function debugUnpreview(){
	diffToVisualize=null;
	redraw();
}

function addToDebugTimeline(level,lineNumber){

	if (!debug_visualisation_array.hasOwnProperty(debugger_turnIndex)){
		debug_visualisation_array[debugger_turnIndex]=[];
	}

	var debugTimelineSnapshot = {
		width:level.width,
		height:level.height,
		layerCount:level.layerCount,
		turnIndex:debugger_turnIndex,
		lineNumber:lineNumber,
		objects:new Int32Array(level.objects),
		movements:new Int32Array(level.movements),
		commandQueue:level.commandQueue.concat([]),
		commandQueueSourceRules:level.commandQueueSourceRules.concat([])
	};
	

	debug_visualisation_array[debugger_turnIndex][lineNumber]=debugTimelineSnapshot;
	return `${debugger_turnIndex},${lineNumber}`;
}
// @@end js/editor.js


// @@begin js/compiler.js

'use strict';

function isColor(str) {
	str = str.trim();
	if (str in colorPalettes.arnecolors)
		return true;
	if (/^#([0-9A-F]{2}){3,4}$/i.test(str))
		return true;
	if (/^#([0-9A-F]{3})$/i.test(str))
		return true;
	if (str === "transparent")
		return true;
	return false;
}

function colorToHex(palette, str) {
    str = str.trim();
    if (str in palette) {
        return palette[str];
    }

    return str;
}


function generateSpriteMatrix(dat) {

    var result = [];
    for (var i = 0; i < dat.length; i++) {
        var row = [];
        for (var j = 0; j < dat.length; j++) {
            var ch = dat[i].charAt(j);
            if (ch == '.') {
                row.push(-1);
            } else {
                row.push(ch);
            }
        }
        result.push(row);
    }
    return result;
}

var debugMode;
var colorPalette;

function generateExtraMembers(state) {

    if (state.collisionLayers.length === 0) {
        logError("No collision layers defined.  All objects need to be in collision layers.");
    }

    //annotate objects with layers
    //assign ids at the same time
    state.idDict = [];
    var idcount = 0;
    for (var layerIndex = 0; layerIndex < state.collisionLayers.length; layerIndex++) {
        for (var j = 0; j < state.collisionLayers[layerIndex].length; j++) {
            var n = state.collisionLayers[layerIndex][j];
            if (n in state.objects) {
                var o = state.objects[n];
                o.layer = layerIndex;
                o.id = idcount;
                state.idDict[idcount] = n;
                idcount++;
            }
        }
    }

    //set object count
    state.objectCount = idcount;

    //calculate blank mask template
    var layerCount = state.collisionLayers.length;
    var blankMask = [];
    for (var i = 0; i < layerCount; i++) {
        blankMask.push(-1);
    }

    // how many words do our bitvecs need to hold?
    STRIDE_OBJ = Math.ceil(state.objectCount / 32) | 0;
    STRIDE_MOV = Math.ceil(layerCount / 5) | 0;
    state.STRIDE_OBJ = STRIDE_OBJ;
    state.STRIDE_MOV = STRIDE_MOV;

    //get colorpalette name
    debugMode = false;
    verbose_logging = false;
    throttle_movement = false;
    colorPalette = colorPalettes.arnecolors;
    for (var i = 0; i < state.metadata.length; i += 2) {
        var key = state.metadata[i];
        var val = state.metadata[i + 1];
        if (key === 'color_palette') {
            if (val in colorPalettesAliases) {
                val = colorPalettesAliases[val];
            }
            if (colorPalettes[val] === undefined) {
                logError('Palette "' + val + '" not found, defaulting to arnecolors.', 0);
            } else {
                colorPalette = colorPalettes[val];
            }
        } else if (key === 'debug') {
            if (IDE && unitTesting===false){
                debugMode = true;
                cache_console_messages = true;
            }
        } else if (key === 'verbose_logging') {
            if (IDE && unitTesting===false){
                verbose_logging = true;
                cache_console_messages = true;
            }
        } else if (key === 'throttle_movement') {
            throttle_movement = true;
        }
    }

    //convert colors to hex
    for (var n in state.objects) {
        if (state.objects.hasOwnProperty(n)) {
            //convert color to hex
            var o = state.objects[n];
            if (o.colors.length > 10) {
                logError("a sprite cannot have more than 10 colors.  Why you would want more than 10 is beyond me.", o.lineNumber + 1);
            }
            for (var i = 0; i < o.colors.length; i++) {
                var c = o.colors[i];
                if (isColor(c)) {
                    c = colorToHex(colorPalette, c);
                    o.colors[i] = c;
                } else {
                    logError('Invalid color specified for object "' + n + '", namely "' + o.colors[i] + '".', o.lineNumber + 1);
                    o.colors[i] = '#ff00ff'; // magenta error color
                }
            }
        }
    }

    //generate sprite matrix
    for (var n in state.objects) {
        if (state.objects.hasOwnProperty(n)) {
            var o = state.objects[n];
            if (o.colors.length==0) {
                logError('color not specified for object "' + n +'".',o.lineNumber);
                o.colors=["#ff00ff"];
            }
           if (o.cloneSprite !== "") {
              //console.log("To clone: "+o.cloneSprite);
              if (state.objects.hasOwnProperty(o.cloneSprite)) {
                  
                  if (state.objects[o.cloneSprite].cloneSprite === "") {
                      o.spritematrix = deepClone(state.objects[o.cloneSprite].spritematrix);
                      //console.log(o.spritematrix);
                  } else {
                      logError("The sprite that "+n+" attempted to clone ("+o.cloneSprite+") clones a sprite itself ("+state.objects[o.cloneSprite].cloneSprite + "), so it can't clone the sprite! You'll need to set up the cloning differently.",o.lineNumber);
                  }
              } else {
                  logError(n +" attempted to clone the sprite matrix of "+o.cloneSprite+", but that object doesn't exist?!",o.lineNumber);
              }
           } 
            /*else /*if (o.colors[o.colors.length-1][0] !== "#") {
                var objectToClone = o.colors[o.colors.length-1];
                if (state.objects.hasOwnProperty(objectToClone)) {
                  o.spritematrix = objectToClone.spritematrix;
                  o.spritematrix = generateSpriteMatrix(o.spritematrix);
                  logWarning("Cloned "+objectToClone, o.lineNumber);
                  continue;
              } else {
                  logError("Attempted to clone the sprite matrix of "+objectToClone+", but that object doesn't exist?!")
              }
          }*/
          else if (o.spritematrix.length===0) {
              o.spritematrix = new Array(state.sprite_size);
              var zeros = new Array(state.sprite_size);
              for(var i = 0; i < state.sprite_size; i++) {
                  zeros[i] = 0;
              }
              for(var i = 0; i < state.sprite_size; i++) {
                  o.spritematrix[i] = zeros;
              }
          } else {
              if ( o.spritematrix.length!==state.sprite_size) {
                  logWarning("Sprite graphics must be " + state.sprite_size + " wide and " + state.sprite_size + " high exactly.",o.lineNumber);
              } else {
                  for(var i = 0; i < state.sprite_size; i++) {
                      if(o.spritematrix[i].length!==state.sprite_size) {
                          logWarning("Sprite graphics must be " + state.sprite_size + " wide and " + state.sprite_size + " high exactly.",o.lineNumber);
                          break;
                      }
                  }
              }
              o.spritematrix = generateSpriteMatrix(o.spritematrix);
          }
        }
    }


    //calculate glyph dictionary
    var glyphDict = {};
    for (var n in state.objects) {
        if (state.objects.hasOwnProperty(n)) {
            var o = state.objects[n];
            var mask = blankMask.concat([]);
            mask[o.layer] = o.id;
            glyphDict[n] = mask;
        }
    }
    var added = true;
    while (added) {
        added = false;

        //then, synonyms
        for (var i = 0; i < state.legend_synonyms.length; i++) {
            var dat = state.legend_synonyms[i];
            var key = dat[0];
            var val = dat[1];
            if ((!(key in glyphDict) || (glyphDict[key] === undefined)) && (glyphDict[val] !== undefined)) {
                added = true;
                glyphDict[key] = glyphDict[val];
            }
        }

        //then, aggregates
        for (var i = 0; i < state.legend_aggregates.length; i++) {
            var dat = state.legend_aggregates[i];
            var key = dat[0];
            var vals = dat.slice(1);
            var allVallsFound = true;
            for (var j = 0; j < vals.length; j++) {
                var v = vals[j];
                if (glyphDict[v] === undefined) {
                    allVallsFound = false;
                    break;
                }
            }
            if ((!(key in glyphDict) || (glyphDict[key] === undefined)) && allVallsFound) {
                var mask = blankMask.concat([]);

                for (var j = 1; j < dat.length; j++) {
                    var n = dat[j];
                    var o = state.objects[n];
                    if (o == undefined) {
                        logError('Object not found with name ' + n, state.lineNumber);
                    }
                    if (mask[o.layer] == -1) {
                        mask[o.layer] = o.id;
                    } else {
                        if (o.layer === undefined) {
                            logError('Object "' + n.toUpperCase() + '" has been defined, but not assigned to a layer.', dat.lineNumber);
                        } else {
                            var n1 = n.toUpperCase();
                            var n2 = state.idDict[mask[o.layer]].toUpperCase();
                            if (n1 !== n2) {
                                logError(
                                    'Trying to create an aggregate object (defined in the legend) with both "' +
                                    n1 + '" and "' + n2 + '", which are on the same layer and therefore can\'t coexist.',
                                    dat.lineNumber
                                );
                            }
                        }
                    }
                }
                added = true;
                glyphDict[dat[0]] = mask;
            }
        }
    }
    state.glyphDict = glyphDict;

    var aggregatesDict = {};
    for (var i = 0; i < state.legend_aggregates.length; i++) {
        var entry = state.legend_aggregates[i];
        aggregatesDict[entry[0]] = entry.slice(1);
    }
    state.aggregatesDict = aggregatesDict;

    var propertiesDict = {};
    for (var i = 0; i < state.legend_properties.length; i++) {
        var entry = state.legend_properties[i];
        propertiesDict[entry[0]] = entry.slice(1);
    }
    state.propertiesDict = propertiesDict;

    //calculate lookup dictionaries
    var synonymsDict = {};
    for (var i = 0; i < state.legend_synonyms.length; i++) {
        var entry = state.legend_synonyms[i];
        var key = entry[0];
        var value = entry[1];
        if (value in aggregatesDict) {
            aggregatesDict[key] = aggregatesDict[value];
        } else if (value in propertiesDict) {
            propertiesDict[key] = propertiesDict[value];
        } else if (key !== value) {
            synonymsDict[key] = value;
        }
    }
    state.synonymsDict = synonymsDict;

    var modified = true;
    while (modified) {
        modified = false;
        for (var n in synonymsDict) {
            if (synonymsDict.hasOwnProperty(n)) {
                var value = synonymsDict[n];
                if (value in propertiesDict) {
                    delete synonymsDict[n];
                    propertiesDict[n] = propertiesDict[value];
                    modified = true;
                } else if (value in aggregatesDict) {
                    delete aggregatesDict[n];
                    aggregatesDict[n] = aggregatesDict[value];
                    modified = true;
                } else if (value in synonymsDict) {
                    synonymsDict[n] = synonymsDict[value];
                }
            }
        }

        for (var n in propertiesDict) {
            if (propertiesDict.hasOwnProperty(n)) {
                var values = propertiesDict[n];
                for (var i = 0; i < values.length; i++) {
                    var value = values[i];
                    if (value in synonymsDict) {
                        values[i] = synonymsDict[value];
                        modified = true;
                    } else if (value in propertiesDict) {
                        values.splice(i, 1);
                        var newvalues = propertiesDict[value];
                        for (var j = 0; j < newvalues.length; j++) {
                            var newvalue = newvalues[j];
                            if (values.indexOf(newvalue) === -1) {
                                values.push(newvalue);
                            }
                        }
                        modified = true;
                    }
                    if (value in aggregatesDict) {
                        logError('Trying to define property "' + n.toUpperCase() + '" in terms of aggregate "' + value.toUpperCase() + '".');
                    }
                }
            }
        }


        for (var n in aggregatesDict) {
            if (aggregatesDict.hasOwnProperty(n)) {
                var values = aggregatesDict[n];
                for (var i = 0; i < values.length; i++) {
                    var value = values[i];
                    if (value in synonymsDict) {
                        values[i] = synonymsDict[value];
                        modified = true;
                    } else if (value in aggregatesDict) {
                        values.splice(i, 1);
                        var newvalues = aggregatesDict[value];
                        for (var j = 0; j < newvalues.length; j++) {
                            var newvalue = newvalues[j];
                            if (values.indexOf(newvalue) === -1) {
                                values.push(newvalue);
                            }
                        }
                        modified = true;
                    }
                    if (value in propertiesDict) {
                        logError('Trying to define aggregate "' + n.toUpperCase() + '" in terms of property "' + value.toUpperCase() + '".');
                    }
                }
            }
        }
    }

    /* determine which properties specify objects all on one layer */
    state.propertiesSingleLayer = {};
    for (var key in propertiesDict) {
        if (propertiesDict.hasOwnProperty(key)) {
            var values = propertiesDict[key];
            var sameLayer = true;
            for (var i = 1; i < values.length; i++) {
                if ((state.objects[values[i - 1]].layer !== state.objects[values[i]].layer)) {
                    sameLayer = false;
                    break;
                }
            }
            if (sameLayer) {
                state.propertiesSingleLayer[key] = state.objects[values[0]].layer;
            }
        }
    }

    if (state.idDict[0] === undefined && state.collisionLayers.length > 0) {
        logError('You need to have some objects defined');
    }

    //set default background object
    var backgroundid;
    var backgroundlayer;
    if (state.objects.background === undefined) {
        if ('background' in state.synonymsDict) {
            var n = state.synonymsDict['background'];
            var o = state.objects[n];
            backgroundid = o.id;
            backgroundlayer = o.layer;
        } else if ('background' in state.propertiesDict) {
            var n = state.propertiesDict['background'][0];
            var o = state.objects[n];
            backgroundid = o.id;
            backgroundlayer = o.layer;
        } else if ('background' in state.aggregatesDict) {
            var o = state.objects[state.idDict[0]];
            backgroundid = o.id;
            backgroundlayer = o.layer;
            logError("background cannot be an aggregate (declared with 'and'), it has to be a simple type, or property (declared in terms of others using 'or').");
        } else {
            var o = state.objects[state.idDict[0]];
            if (o!=null){
                backgroundid = o.id;
                backgroundlayer = o.layer;
            }
            logError("you have to define something to be the background");
        }
    } else {
        backgroundid = state.objects.background.id;
        backgroundlayer = state.objects.background.layer;
    }
    state.backgroundid = backgroundid;
    state.backgroundlayer = backgroundlayer;
}

function generateExtraMembersPart2(state) {
	function assignMouseObject(preludeTerm, defaultName) {
		if (preludeTerm in state.metadata) {
			var name = state.metadata[preludeTerm] || defaultName;
            var id = null;
            var object = null;
			if (state.objects[name]) {
                id = state.objects[name].id;
                object = state.objects[name];
			} else {
				if (name in state.synonymsDict) {
					var n = state.synonymsDict[name];
					var o = state.objects[n];
                    id = o.id;
                    object = o;
				} else {
					var o=state.objects[state.idDict[1]];
					id=o.id;
					logError(name + " object/alias has to be defined");
				}
            }
            
            if (object != null && object.layer !== undefined) {
                var layerID = object.layer;
                if (state.collisionLayers[layerID].length != 1) {
                    logWarningNoLine("[PS+] Mouse object '"+name+"' (for input '"+ preludeTerm +"') could overlap with other objects on the same layer. Consider moving the object to its own layer.", true, false);
                }
            }

			return id;
		}
	}
	
	state.lmbID = assignMouseObject("mouse_left", "lmb");
	state.rmbID = assignMouseObject("mouse_right", "rmb");
	state.dragID = assignMouseObject("mouse_drag", "drag");
	state.rdragID = assignMouseObject("mouse_rdrag", "rdrag");
	state.lmbupID = assignMouseObject("mouse_up", "lmbup");
	state.rmbupID = assignMouseObject("mouse_rup", "rmbup");
	
	if ("mouse_obstacle" in state.metadata) {
		var name = state.metadata["mouse_obstacle"];
		
		if (name) {
			state.obstacleMask = state.objectMasks[name];
			if (!state.obstacleMask) {
				logError(name + " object/alias has to be defined.");
				state.obstacleMask = state.objectMasks["background"];
			}
		}
	}
}

Level.prototype.calcBackgroundMask = function(state) {
    if (state.backgroundlayer === undefined) {
        logError("you have to have a background layer");
    }

    var backgroundMask = state.layerMasks[state.backgroundlayer];
    for (var i = 0; i < this.n_tiles; i++) {
        var cell = this.getCell(i);
        cell.iand(backgroundMask);
        if (!cell.iszero()) {
            return cell;
        }
    }
    cell = new BitVec(STRIDE_OBJ);
    cell.ibitset(state.backgroundid);
    return cell;
}

function levelFromString(state,level) {
	var backgroundlayer=state.backgroundlayer;
	var backgroundid=state.backgroundid;
	var backgroundLayerMask = state.layerMasks[backgroundlayer];
	var o = new Level(level[0], level[2].length, level.length-2, state.collisionLayers.length, null, level[1]);
	o.objects = new Int32Array(o.width * o.height * STRIDE_OBJ);

	for (var i = 0; i < o.width; i++) {
		for (var j = 0; j < o.height; j++) {
			var ch = level[j+2].charAt(i);
			if (ch.length==0) {
				ch=level[j+2].charAt(level[j+2].length-1);
			}
			var mask = state.glyphDict[ch];

			if (mask == undefined) {
				if (state.propertiesDict[ch]===undefined) {
					logError('Error, symbol "' + ch + '", used in map, not found.', level[0]+j);
				} else {
					logError('Error, symbol "' + ch + '" is defined using \'or\', and therefore ambiguous - it cannot be used in a map. Did you mean to define it in terms of \'and\'?', level[0]+j);							
				}

			}

			var maskint = new BitVec(STRIDE_OBJ);
			mask = mask.concat([]);					
			for (var z = 0; z < o.layerCount; z++) {
				if (mask[z]>=0) {
					maskint.ibitset(mask[z]);
				}
			}
			for (var w = 0; w < STRIDE_OBJ; ++w) {
				o.objects[STRIDE_OBJ * (i * o.height + j) + w] = maskint.data[w];
			}
		}
	}

	var levelBackgroundMask = o.calcBackgroundMask(state);
	for (var i=0;i<o.n_tiles;i++)
	{
		var cell = o.getCell(i);
		if (!backgroundLayerMask.anyBitsInCommon(cell)) {
			cell.ior(levelBackgroundMask);
			o.setCell(i, cell);
		}
	}
	return o;
}
//also assigns glyphDict
function levelsToArray(state) {
	var levels = state.levels;
	var processedLevels = [];
	var sectionTerminated = false;
	var previousSection = null;

	for (var levelIndex = 0; levelIndex < levels.length; levelIndex++) {
		var level = levels[levelIndex];
		if (level.length == 0) {
			continue;
		}
		
		var o;
		if (level[0] == 'message') {
			o = {
				message: level[1],
				section: level[3]
			};
			splitMessage = wordwrap(o.message,intro_template[0].length);
			if (splitMessage.length>12){
				logWarning('Message too long to fit on screen.', level[2]);
			}
			if(o.section != previousSection) {sectionTerminated = false; previousSection = o.section;}
			if(sectionTerminated) logWarning('Message unreachable due to previous GOTO.', level[2]);
		} else if (level[0] == 'goto') {
			o = {
				target: level[1],
				lineNumber: level[2],
				section: level[3]
			};
			if(o.section != previousSection) {sectionTerminated = false; previousSection = o.section;}
			if(sectionTerminated) logWarning('GOTO unreachable due to previous GOTO.', o.lineNumber);
			sectionTerminated = true;
		} else {
			o = levelFromString(state,level);
			if(o.section != previousSection) {sectionTerminated = false; previousSection = o.section;}
			if(sectionTerminated) logWarning('Level unreachable due to previous GOTO.', o.lineNumber);
		}
		processedLevels.push(o);
	}

	state.levels = processedLevels;
}

function extractSections(state) {
	var sections = [];

	var lastSection = null;

	for(var i = 0; i < state.levels.length; i++) {
		var level = state.levels[i];
		
		if(level.section != lastSection) {
			var o = {
				name: level.section,
				firstLevel: i
			};
			if(o.name == "__WIN__") {
				state.winSection = o;
			} else {
				sections.push(o);
			}
			
			lastSection = level.section;
		}
	}

	state.sections = sections;
}

function convertSectionNamesToIndices(state) {
	var sectionMap = {};
	var duplicateSections = {};
	for (var s = 0; s < state.sections.length; s++) {
		var sectionName = state.sections[s].name.toLowerCase();
		if(sectionMap[sectionName] === undefined){
			sectionMap[sectionName] = s;
		}else{
			duplicateSections[sectionName] = true;
		}
	}
	
	// GOTO commands in the RULES
	for (var r = 0; r < state.rules.length; r++) {
		var rule = state.rules[r];
		for (var c = 0; c < rule.commands.length; c++) {
			var command = rule.commands[c];
			if (command[0] != 'goto') continue;
			var sectionName = command[1].toLowerCase();
			var sectionIndex = sectionMap[sectionName];
			if (sectionIndex === undefined){
				logError('Invalid GOTO command - There is no section named "'+command[1]+'". Either it does not exist, or it has zero levels.', rule.lineNumber);
				sectionIndex = -1;
			}else if (duplicateSections[sectionName] !== undefined){
				logError('Invalid GOTO command - There are multiple sections named "'+command[1]+'". Section names must be unique for GOTO to work.', rule.lineNumber);
				sectionIndex = -1;
			}
			command[1] = sectionIndex;
		}
	}
	
	// GOTO commands in the LEVELS
	for (var i = 0; i < state.levels.length; i++) {
		var level = state.levels[i];
		if (level.target === undefined) continue; // This was a level or a message, but not a goto.
		var targetName = level.target.toLowerCase();
		var targetIndex = sectionMap[targetName];
		if (targetIndex === undefined){
			logError('Invalid GOTO command - There is no section named "'+command[1]+'".', level.lineNumber);
			targetIndex = 0;
		}else if (duplicateSections[targetName] !== undefined){
			logError('Invalid GOTO command - There are multiple sections named "'+command[1]+'".', level.lineNumber);
			targetIndex = 0;
		}
		level.target = targetIndex;
	}
}

var directionaggregates = {
    'horizontal': ['left', 'right'],
    'horizontal_par': ['left', 'right'],
    'horizontal_perp': ['left', 'right'],
    'vertical': ['up', 'down'],
    'vertical_par': ['up', 'down'],
    'vertical_perp': ['up', 'down'],
    'moving': ['up', 'down', 'left', 'right', 'action'],
    'orthogonal': ['up', 'down', 'left', 'right'],
    'perpendicular': ['^', 'v'],
    'parallel': ['<', '>']
};

var relativeDirections = ['^', 'v', '<', '>', 'perpendicular', 'parallel'];
var simpleAbsoluteDirections = ['up', 'down', 'left', 'right'];
var simpleRelativeDirections = ['^', 'v', '<', '>'];
var reg_directions_only = /^(\>|\<|\^|v|up|down|left|right|moving|stationary|no|randomdir|random|horizontal|vertical|orthogonal|perpendicular|parallel|action)$/i;
//redeclaring here, i don't know why
var commandwords = ["sfx0","sfx1","sfx2","sfx3","sfx4","sfx5","sfx6","sfx7","sfx8","sfx9","sfx10","cancel","checkpoint","restart","win","message","again","undo",
  "nosave","quit","zoomscreen","flickscreen","smoothscreen","again_interval","realtime_interval","key_repeat_interval",'noundo','norestart','background_color','text_color','goto','message_text_align'];
function directionalRule(rule) {
    for (var i = 0; i < rule.lhs.length; i++) {
        var cellRow = rule.lhs[i];
        if (cellRow.length > 1) {
            return true;
        }
        for (var j = 0; j < cellRow.length; j++) {
            var cell = cellRow[j];
            for (var k = 0; k < cell.length; k += 2) {
                if (relativeDirections.indexOf(cell[k]) >= 0) {
                    return true;
                }
            }
        }
    }
    for (var i = 0; i < rule.rhs.length; i++) {
        var cellRow = rule.rhs[i];
        if (cellRow.length > 1) {
            return true;
        }
        for (var j = 0; j < cellRow.length; j++) {
            var cell = cellRow[j];
            for (var k = 0; k < cell.length; k += 2) {
                if (relativeDirections.indexOf(cell[k]) >= 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function findIndexAfterToken(str, tokens, tokenIndex) {
    str = str.toLowerCase();
    var curIndex = 0;
    for (var i = 0; i <= tokenIndex; i++) {
        var token = tokens[i];
        curIndex = str.indexOf(token, curIndex) + token.length;
    }
    return curIndex;
}
function rightBracketToRightOf(tokens,i){
    for(;i<tokens.length;i++){
        if (tokens[i]==="]"){
            return true;
        }
    }
    return false;
}

function processRuleString(rule, state, curRules) {
    /*

    	intermediate structure
    		dirs: Directions[]
    		pre : CellMask[]
    		post : CellMask[]

    		//pre/post pairs must have same lengths
    	final rule structure
    		dir: Direction
    		pre : CellMask[]
    		post : CellMask[]
    */
    var line = rule[0];
    var lineNumber = rule[1];
    var origLine = rule[2];

    // STEP ONE, TOKENIZE
    line = line.replace(/\[/g, ' [ ').replace(/\]/g, ' ] ').replace(/\|/g, ' | ').replace(/\-\>/g, ' -> ');
    line = line.trim();
    if (line[0] === '+') {
        line = line.substring(0, 1) + " " + line.substring(1, line.length);
    }
    var tokens = line.split(/\s/).filter(function(v) { return v !== '' });

    if (tokens.length == 0) {
        logError('Spooky error!  Empty line passed to rule function.', lineNumber);
    }


// STEP TWO, READ DIRECTIONS
/*
	STATE
	0 - scanning for initial directions
	LHS
	1 - reading cell contents LHS
	2 - reading cell contents RHS
*/
var parsestate = 0;
var directions = [];

var curcell = null; // [up, cat, down mouse]
var curcellrow = []; // [  [up, cat]  [ down, mouse ] ]

var incellrow = false;

    var appendGroup = false;
    var rhs = false;
    var lhs_cells = [];
    var rhs_cells = [];
    var late = false;
    var rigid = false;
    var groupNumber = lineNumber;
    var commands = [];
    var randomRule = false;
    var has_plus = false;
    var globalRule=false;

if (tokens.length===1) {
    if (tokens[0]==="startloop" ) {
        rule_line = {
            bracket: 1
        }
        return rule_line;
    } else if (tokens[0]==="endloop" ) {
        rule_line = {
            bracket: -1
        }
        return rule_line;
    }
}

if (tokens.indexOf('->') == -1) {
    logError("A rule has to have an arrow in it.  There's no arrow here! Consider reading up about rules - you're clearly doing something weird", lineNumber);
}

    var curcell = [];
    var bracketbalance = 0;
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        switch (parsestate) {
            case 0:
                {
                    //read initial directions
                    if (token === '+') {
                        has_plus=true;
                        if (groupNumber === lineNumber) {
                            if (curRules.length == 0) {
                                logError('The "+" symbol, for joining a rule with the group of the previous rule, needs a previous rule to be applied to.');
                            }
                            if (i !== 0) {
                                logError('The "+" symbol, for joining a rule with the group of the previous rule, must be the first symbol on the line ');
                            }
                            groupNumber = curRules[curRules.length - 1].groupNumber;
                        } else {
                            logError('Two "+"s ("append to previous rule group" symbol) applied to the same rule.', lineNumber);
                        }
                    } else if (token in directionaggregates) {
                        directions = directions.concat(directionaggregates[token]);
                    } else if (token === 'late') {
                        late = true;
                    } else if (token === 'rigid') {
                        rigid = true;
                    } else if (token === 'random') {
                        randomRule = true;
                        if (has_plus)
                        {
                            logError(`A rule-group can only be marked random by the opening rule in the group (aka, a '+' and 'random' can't appear as rule modifiers on the same line).  Why? Well, you see "random" isn't a property of individual rules, but of whole rule groups.  It indicates that a single possible application of some rule from the whole group should be applied at random.`, lineNumber) 
                        }

                    }else if (token==='global') {
                        globalRule=true;
                    } else if (simpleAbsoluteDirections.indexOf(token) >= 0) {
                        directions.push(token);
                    } else if (simpleRelativeDirections.indexOf(token) >= 0) {
                        logError('You cannot use relative directions (\"^v<>\") to indicate in which direction(s) a rule applies.  Use absolute directions indicators (Up, Down, Left, Right, Horizontal, or Vertical, for instance), or, if you want the rule to apply in all four directions, do not specify directions', lineNumber);
                    } else if (token == '[') {
                        if (directions.length == 0) {
                            directions = directions.concat(directionaggregates['orthogonal']);
                        }
                        parsestate = 1;
                        i--;
                    } else {
                        logError("The start of a rule must consist of some number of directions (possibly 0), before the first bracket, specifying in what directions to look (with no direction specified, it applies in all four directions).  It seems you've just entered \"" + token.toUpperCase() + '\".', lineNumber);
            }
            break;
        }
        case 1: {
            if (token == '[') {
                bracketbalance++;
                if(bracketbalance>1){
                    logWarning("Multiple opening brackets without closing brackets.  Something fishy here.  Every '[' has to be closed by a ']', and you can't nest them.", lineNumber);
                }
                if (curcell.length > 0) {
                    logError('Error, malformed cell rule - encountered a "["" before previous bracket was closed', lineNumber);
                }
                incellrow = true;
                curcell = [];
            } else if (reg_directions_only.exec(token)) {
                if (curcell.length % 2 == 1) {
                    logError("Error, an item can only have one direction/action at a time, but you're looking for several at once!", lineNumber);
                } else if (!incellrow) {
                    logWarning("Invalid syntax. Directions should be placed at the start of a rule.", lineNumber);
                } else if (late && token!=='no' && token!=='random' && token!=='randomdir') {
                    logError("Movements cannot appear in late rules.", lineNumber);
                  } else {
                    curcell.push(token);
                }
            } else if (token == '|') {
                if (!incellrow) {
                    logWarning('Janky syntax.  "|" should only be used inside cell rows (the square brackety bits).',lineNumber);
                } else if (curcell.length % 2 == 1) {
                    logError('In a rule, if you specify a force, it has to act on an object.', lineNumber);
                } else {
                    curcellrow.push(curcell);
                    curcell = [];
                }
            } else if (token === ']') {
                
                bracketbalance--;
                if(bracketbalance<0){
                    logWarning("Multiple closing brackets without corresponding opening brackets.  Something fishy here.  Every '[' has to be closed by a ']', and you can't nest them.", lineNumber);
                }

                if (curcell.length % 2 == 1) {
                    if (curcell[0]==='...') {
                        logError('Cannot end a rule with ellipses.', lineNumber);
                    } else {
                        logError('In a rule, if you specify a force, it has to act on an object.', lineNumber);
                    }
                } else {
                    curcellrow.push(curcell);
                    curcell = [];
                }

                if (rhs) {
                    rhs_cells.push(curcellrow);
                } else {
                    lhs_cells.push(curcellrow);
                }
                curcellrow = [];
                incellrow = false;
            } else if (token === '->') {
                if (incellrow) {
                    logError('Encountered an unexpected "->" inside square brackets.  It\'s used to separate states, it has no place inside them >:| .', lineNumber);
                } else if (rhs) {
                    logError('Error, you can only use "->" once in a rule; it\'s used to separate before and after states.', lineNumber);
                }  else {
                    rhs = true;
                }
            } else if (state.names.indexOf(token) >= 0) {
                if (!incellrow) {
                     logWarning("Invalid token "+token.toUpperCase() +". Object names should only be used within cells (square brackets).", lineNumber);
                 }
                 else if (curcell.length % 2 == 0) {
                    curcell.push('');
                    curcell.push(token);
                } else if (curcell.length % 2 == 1) {
                    curcell.push(token);
                }
            } else if (token==='...') {
                if (!incellrow) {
                     logWarning("Invalid syntax, ellipses should only be used within cells (square brackets).", lineNumber);
                 } else {
                     curcell.push(token);
                     curcell.push(token);
                 }
            } else if (commandwords.indexOf(token.toLowerCase())>=0) {
                if (rhs===false) {
                    logError("Commands should only appear at the end of rules, not in or before the pattern-detection/-replacement sections.", lineNumber);
                } else if (incellrow || rightBracketToRightOf(tokens,i)){//only a warning for legacy support reasons.
                    logWarning("Commands should only appear at the end of rules, not in or before the pattern-detection/-replacement sections.", lineNumber);
                }
                if (token.toLowerCase()==='message') {
                    var messageIndex = findIndexAfterToken(origLine,tokens,i);
                    var messageStr = origLine.substring(messageIndex).trim();
                    if (messageStr===""){
                        messageStr=" ";
                        //needs to be nonempty or the system gets confused and thinks it's a whole level message rather than an interstitial.
                    }
                    commands.push([token.toLowerCase(), messageStr]);
                    i=tokens.length;
                }else if (token.toLowerCase()==='goto') {
                    var messageIndex = findIndexAfterToken(origLine,tokens,i);
                    var messageStr = origLine.substring(messageIndex).trim();
                    if (messageStr===""){
                        messageStr=" ";
                        //needs to be nonempty or the system gets confused and thinks it's a whole level message rather than an interstitial.
                    }
                    commands.push([token.toLowerCase(), messageStr]);
                    i=tokens.length;
                } else if (twiddleable_params.includes(token.toLowerCase())) {
                    if (!state.metadata.includes("runtime_metadata_twiddling")) {
                        logError("You can only change a flag at runtime if you have the 'runtime_metadata_twiddling' prelude flag defined!",lineNumber)
                    } else {
                        var messageIndex = findIndexAfterToken(origLine,tokens,i);
                        var messageStr = origLine.substring(messageIndex).trim();
                        if (messageStr===""){
                            logError('[PS+] You included a twiddleable property, but did not specify a value. The twiddle may behave strangely. Please use "set", "default", "wipe", or specify the correct value. See the documentation for more info.', lineNumber);
                            messageStr=" ";
                            //needs to be nonempty or the system gets confused and thinks it's a whole level message rather than an interstitial.
                        }
                        commands.push([token.toLowerCase(), messageStr]);
                    }
                    i=tokens.length;
                }  else {
                    commands.push([token.toLowerCase()]);
                }
            } else {
                logError('Error, malformed cell rule - was looking for cell contents, but found "' + token + '".  What am I supposed to do with this, eh, please tell me that.', lineNumber);
            }
        }

    }
}

if (lhs_cells.length != rhs_cells.length) {
    if (commands.length>0&&rhs_cells.length==0) {
        //ok
    } else {
        logError('Error, when specifying a rule, the number of matches (square bracketed bits) on the left hand side of the arrow must equal the number on the right', lineNumber);
    }
} else {
    for (var i = 0; i < lhs_cells.length; i++) {
        if (lhs_cells[i].length != rhs_cells[i].length) {
            logError('In a rule, each pattern to match on the left must have a corresponding pattern on the right of equal length (number of cells).', lineNumber);
            state.invalid=true;
        }
        if (lhs_cells[i].length == 0) {
            logError("You have an totally empty pattern on the left-hand side.  This will match *everything*.  You certainly don't want this.");
        }
    }
}

if (lhs_cells.length == 0) {
    logError('This rule refers to nothing.  What the heck? :O', lineNumber);
}

var rule_line = {
    directions: directions,
    lhs: lhs_cells,
    rhs: rhs_cells,
    lineNumber: lineNumber,
    late: late,
    rigid: rigid,
    groupNumber: groupNumber,
    commands: commands,
    randomRule: randomRule,
    globalRule: globalRule
};

    if (directionalRule(rule_line) === false && rule_line.directions.length>1) {
        rule_line.directions.splice(1);
    }

//next up - replace relative directions with absolute direction

return rule_line;
}

function deepCloneHS(HS) {
    var cloneHS = HS.map(function(arr) { return arr.map(function(deepArr) { return deepArr.slice(); }); });
    return cloneHS;
}

function deepCloneRule(rule) {
	var clonedRule = {
		direction: rule.direction,
		lhs: deepCloneHS(rule.lhs),
		rhs: deepCloneHS(rule.rhs),
		lineNumber: rule.lineNumber,
		late: rule.late,
		rigid: rule.rigid,
		groupNumber: rule.groupNumber,
		commands:rule.commands,
		randomRule:rule.randomRule,
		globalRule:rule.globalRule
	};
	return clonedRule;
}

function rulesToArray(state) {
    var oldrules = state.rules;
    var rules = [];
    var loops = [];
    for (var i = 0; i < oldrules.length; i++) {
        var lineNumber = oldrules[i][1];
        var newrule = processRuleString(oldrules[i], state, rules);
        if (newrule.bracket !== undefined) {
            loops.push([lineNumber, newrule.bracket]);
            continue;
        }
        rules.push(newrule);
    }
    state.loops = loops;

    //now expand out rules with multiple directions
    var rules2 = [];
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        var ruledirs = rule.directions;
        for (var j = 0; j < ruledirs.length; j++) {
            var dir = ruledirs[j];
            if (dir in directionaggregates && directionalRule(rule)) {
                var dirs = directionaggregates[dir];
                for (var k = 0; k < dirs.length; k++) {
                    var modifiedrule = deepCloneRule(rule);
                    modifiedrule.direction = dirs[k];
                    rules2.push(modifiedrule);
                }
            } else {
                var modifiedrule = deepCloneRule(rule);
                modifiedrule.direction = dir;
                rules2.push(modifiedrule);
            }
        }
    }

    for (var i = 0; i < rules2.length; i++) {
        var rule = rules2[i];
        //remove relative directions
        convertRelativeDirsToAbsolute(rule);
        //optional: replace up/left rules with their down/right equivalents
        rewriteUpLeftRules(rule);
        //replace aggregates with what they mean
        atomizeAggregates(state, rule);

        if (state.invalid){
            return;
        }
        
        //replace synonyms with what they mean
        rephraseSynonyms(state, rule);
    }

    var rules3 = [];
    //expand property rules
    for (var i = 0; i < rules2.length; i++) {
        var rule = rules2[i];
        rules3 = rules3.concat(concretizeMovingRule(state, rule, rule.lineNumber));
    }

    var rules4 = [];
    for (var i = 0; i < rules3.length; i++) {
        var rule = rules3[i];
        rules4 = rules4.concat(concretizePropertyRule(state, rule, rule.lineNumber));

    }

    for (i=0;i<rules4.length;i++){
        makeSpawnedObjectsStationary(state,rules4[i],rule.lineNumber);
    }
    state.rules = rules4;
}

function containsEllipsis(rule) {
    for (var i = 0; i < rule.lhs.length; i++) {
        for (var j = 0; j < rule.lhs[i].length; j++) {
            if (rule.lhs[i][j][1] === '...')
                return true;
        }
    }
    return false;
}

function rewriteUpLeftRules(rule) {
    if (containsEllipsis(rule)) {
        return;
    }

    if (rule.direction == 'up') {
        rule.direction = 'down';
    } else if (rule.direction == 'left') {
        rule.direction = 'right';
    } else {
        return;
    }

    for (var i = 0; i < rule.lhs.length; i++) {
        rule.lhs[i].reverse();
        if (rule.rhs.length > 0) {
            rule.rhs[i].reverse();
        }
    }
}

//expands all properties to list of all things it could be, filterio
function getPossibleObjectsFromCell(state, cell) {
    var result = [];
    for (var j = 0; j < cell.length; j += 2) {
        var dir = cell[j];
        var name = cell[j + 1];
        if (name in state.objects){
            result.push(name);
        }
        else if (name in state.propertiesDict) {
            var aliases = state.propertiesDict[name];
            for (var k = 0; k < aliases.length; k++) {
                var alias = aliases[k];
                result.push(alias);
            }        
        }
    }
    return result;
}

function getPropertiesFromCell(state, cell) {
    var result = [];
    for (var j = 0; j < cell.length; j += 2) {
        var dir = cell[j];
        var name = cell[j + 1];
        if (dir == "random") {
            continue;
        }
        if (name in state.propertiesDict) {
            result.push(name);
        }
    }
    return result;
}

//returns you a list of object names in that cell that're moving
function getMovings(state, cell) {
    var result = [];
    for (var j = 0; j < cell.length; j += 2) {
        var dir = cell[j];
        var name = cell[j + 1];
        if (dir in directionaggregates) {
            result.push([name, dir]);
        }
    }
    return result;
}

function concretizePropertyInCell(cell, property, concreteType) {
    for (var j = 0; j < cell.length; j += 2) {
        if (cell[j + 1] === property && cell[j] !== "random") {
            cell[j + 1] = concreteType;
        }
    }
}

function concretizeMovingInCell(cell, ambiguousMovement, nameToMove, concreteDirection) {
    for (var j = 0; j < cell.length; j += 2) {
        if (cell[j] === ambiguousMovement && cell[j + 1] === nameToMove) {
            cell[j] = concreteDirection;
        }
    }
}

function concretizeMovingInCellByAmbiguousMovementName(cell, ambiguousMovement, concreteDirection) {
    for (var j = 0; j < cell.length; j += 2) {
        if (cell[j] === ambiguousMovement) {
            cell[j] = concreteDirection;
        }
    }
}

function expandNoPrefixedProperties(state, cell) {
    var expanded = [];
    for (var i = 0; i < cell.length; i += 2) {
        var dir = cell[i];
        var name = cell[i + 1];

        if (dir === 'no' && (name in state.propertiesDict)) {
            var aliases = state.propertiesDict[name];
            for (var j = 0; j < aliases.length; j++) {
                var alias = aliases[j];
                expanded.push(dir);
                expanded.push(alias);
            }
        } else {
            expanded.push(dir);
            expanded.push(name);
        }
    }
    return expanded;
}

function concretizePropertyRule(state, rule, lineNumber) {

    //step 1, rephrase rule to change "no flying" to "no cat no bat"
    for (var i = 0; i < rule.lhs.length; i++) {
        var cur_cellrow_l = rule.lhs[i];
        for (var j = 0; j < cur_cellrow_l.length; j++) {
            cur_cellrow_l[j] = expandNoPrefixedProperties(state, cur_cellrow_l[j]);
            if (rule.rhs.length > 0)
                rule.rhs[i][j] = expandNoPrefixedProperties(state, rule.rhs[i][j]);
        }
    }

    //are there any properties we could avoid processing?
    // e.g. [> player | movable] -> [> player | > movable],
    // 		doesn't need to be split up (assuming single-layer player/block aggregates)

    // we can't manage this if they're being used to disambiguate
    var ambiguousProperties = {};

    for (var j = 0; j < rule.rhs.length; j++) {
        var row_l = rule.lhs[j];
        var row_r = rule.rhs[j];
        for (var k = 0; k < row_r.length; k++) {
            var properties_l = getPropertiesFromCell(state, row_l[k]);
            var properties_r = getPropertiesFromCell(state, row_r[k]);
            for (var prop_n = 0; prop_n < properties_r.length; prop_n++) {
                var property = properties_r[prop_n];
                if (properties_l.indexOf(property) == -1) {
                    ambiguousProperties[property] = true;
                }
            }
        }
    }

    var shouldremove;
    var result = [rule];
    var modified = true;
    while (modified) {
        modified = false;
        for (var i = 0; i < result.length; i++) {
            //only need to iterate through lhs
            var cur_rule = result[i];
            shouldremove = false;
            for (var j = 0; j < cur_rule.lhs.length && !shouldremove; j++) {
                var cur_rulerow = cur_rule.lhs[j];
                for (var k = 0; k < cur_rulerow.length && !shouldremove; k++) {
                    var cur_cell = cur_rulerow[k];
                    var properties = getPropertiesFromCell(state, cur_cell);
                    for (var prop_n = 0; prop_n < properties.length; ++prop_n) {
                        var property = properties[prop_n];

                        if (state.propertiesSingleLayer.hasOwnProperty(property) &&
                            ambiguousProperties[property] !== true) {
                            // we don't need to explode this property
                            continue;
                        }

                        var aliases = state.propertiesDict[property];

                        shouldremove = true;
                        modified = true;

                        //just do the base property, let future iterations take care of the others

                        for (var l = 0; l < aliases.length; l++) {
                            var concreteType = aliases[l];
                            var newrule = deepCloneRule(cur_rule);
                            newrule.propertyReplacement = {};
                            for (var prop in cur_rule.propertyReplacement) {
                                if (cur_rule.propertyReplacement.hasOwnProperty(prop)) {
                                    var propDat = cur_rule.propertyReplacement[prop];
                                    newrule.propertyReplacement[prop] = [propDat[0], propDat[1]];
                                }
                            }

                            concretizePropertyInCell(newrule.lhs[j][k], property, concreteType);
                            if (newrule.rhs.length > 0) {
                                concretizePropertyInCell(newrule.rhs[j][k], property, concreteType); //do for the corresponding rhs cell as well
                            }

                            if (newrule.propertyReplacement[property] === undefined) {
                                newrule.propertyReplacement[property] = [concreteType, 1];
                            } else {
                                newrule.propertyReplacement[property][1] = newrule.propertyReplacement[property][1] + 1;
                            }

                            result.push(newrule);
                        }

                        break;
                    }
                }
            }
            if (shouldremove) {
                result.splice(i, 1);
                i--;
            }
        }
    }


    for (var i = 0; i < result.length; i++) {
        //for each rule
        var cur_rule = result[i];
        if (cur_rule.propertyReplacement === undefined) {
            continue;
        }

        //for each property replacement in that rule
        for (var property in cur_rule.propertyReplacement) {
            if (cur_rule.propertyReplacement.hasOwnProperty(property)) {
                var replacementInfo = cur_rule.propertyReplacement[property];
                var concreteType = replacementInfo[0];
                var occurrenceCount = replacementInfo[1];
                if (occurrenceCount === 1) {
                    //do the replacement
                    for (var j = 0; j < cur_rule.rhs.length; j++) {
                        var cellRow_rhs = cur_rule.rhs[j];
                        for (var k = 0; k < cellRow_rhs.length; k++) {
                            var cell = cellRow_rhs[k];
                            concretizePropertyInCell(cell, property, concreteType);
                        }
                    }
                }
            }
        }
    }

    //if any properties remain on the RHSes, bleep loudly
    var rhsPropertyRemains = '';
    for (var i = 0; i < result.length; i++) {
        var cur_rule = result[i];
        delete result.propertyReplacement;
        for (var j = 0; j < cur_rule.rhs.length; j++) {
            var cur_rulerow = cur_rule.rhs[j];
            for (var k = 0; k < cur_rulerow.length; k++) {
                var cur_cell = cur_rulerow[k];
                var properties = getPropertiesFromCell(state, cur_cell);
                for (var prop_n = 0; prop_n < properties.length; prop_n++) {
                    if (ambiguousProperties.hasOwnProperty(properties[prop_n])) {
                        rhsPropertyRemains = properties[prop_n];
                    }
                }
            }
        }
    }


    if (rhsPropertyRemains.length > 0) {
        logError('This rule has a property on the right-hand side, \"' + rhsPropertyRemains.toUpperCase() + "\", that can't be inferred from the left-hand side.  (either for every property on the right there has to be a corresponding one on the left in the same cell, OR, if there's a single occurrence of a particular property name on the left, all properties of the same name on the right are assumed to be the same).", lineNumber);
    }

    return result;
}

function makeSpawnedObjectsStationary(state,rule,lineNumber){
    //movement not getting correctly cleared from tile #492
    //[ > Player | ] -> [ Crate | Player ] if there was a player already in the second cell, it's not replaced with a stationary player.
    //if there are properties remaining by this stage, just ignore them ( c.f. "[ >  Moveable | Moveable ] -> [ > Moveable | > Moveable ]" in block faker, what's left in this form) - this only happens IIRC when the properties span a single layer so it's)
    //if am object without moving-annotations appears on the RHS, and that object is not present on the lhs (either explicitly as an object, or implicitly in a property), add a 'stationary'
    if (rule.late){
        return;
    }

    for (var j = 0; j < rule.rhs.length; j++) {
        var row_l = rule.lhs[j];
        var row_r = rule.rhs[j];
        for (var k = 0; k < row_r.length; k++) {
            var cell=row_r[k];

            //this is super intricate. uff. 
            var objects_l = getPossibleObjectsFromCell(state, row_l[k]);
            var layers = objects_l.map(n=>state.objects[n].layer);
            for (var l = 0; l < cell.length; l += 2) {
                var dir = cell[l];
                if (dir!==""){
                    continue;
                }
                var name = cell[l + 1];
                if (name in state.propertiesDict || objects_l.indexOf(name)>=0){
                    continue;
                }
                var r_layer = state.objects[name].layer;
                if (layers.indexOf(r_layer)===-1){
                    cell[l]='stationary';
                }
            }
        }
    }

}

function concretizeMovingRule(state, rule, lineNumber) {

    var shouldremove;
    var result = [rule];
    var modified = true;
    while (modified) {
        modified = false;
        for (var i = 0; i < result.length; i++) {
            //only need to iterate through lhs
            var cur_rule = result[i];
            shouldremove = false;
            for (var j = 0; j < cur_rule.lhs.length; j++) {
                var cur_rulerow = cur_rule.lhs[j];
                for (var k = 0; k < cur_rulerow.length; k++) {
                    var cur_cell = cur_rulerow[k];
                    var movings = getMovings(state, cur_cell); //finds aggregate directions
                    if (movings.length > 0) {
                        shouldremove = true;
                        modified = true;

                        //just do the base property, let future iterations take care of the others
                        var cand_name = movings[0][0];
                        var ambiguous_dir = movings[0][1];
                        var concreteDirs = directionaggregates[ambiguous_dir];
                        for (var l = 0; l < concreteDirs.length; l++) {
                            var concreteDirection = concreteDirs[l];
                            var newrule = deepCloneRule(cur_rule);

                            //deep copy replacements
                            newrule.movingReplacement = {};
                            for (var moveTerm in cur_rule.movingReplacement) {
                                if (cur_rule.movingReplacement.hasOwnProperty(moveTerm)) {
                                    var moveDat = cur_rule.movingReplacement[moveTerm];
                                    newrule.movingReplacement[moveTerm] = [moveDat[0], moveDat[1], moveDat[2],moveDat[3],moveDat[4],moveDat[5]];
                                }
                            }
                            newrule.aggregateDirReplacement = {};
                            for (var moveTerm in cur_rule.aggregateDirReplacement) {
                                if (cur_rule.aggregateDirReplacement.hasOwnProperty(moveTerm)) {
                                    var moveDat = cur_rule.aggregateDirReplacement[moveTerm];
                                    newrule.aggregateDirReplacement[moveTerm] = [moveDat[0], moveDat[1], moveDat[2]];
                                }                                
                            }

                            concretizeMovingInCell(newrule.lhs[j][k], ambiguous_dir, cand_name, concreteDirection);
                            if (newrule.rhs.length > 0) {
                                concretizeMovingInCell(newrule.rhs[j][k], ambiguous_dir, cand_name, concreteDirection); //do for the corresponding rhs cell as well
                            }

                            if (newrule.movingReplacement[cand_name+ambiguous_dir] === undefined) {
                                newrule.movingReplacement[cand_name+ambiguous_dir] = [concreteDirection, 1, ambiguous_dir,cand_name,j,k];
                            } else {
                                var mr = newrule.movingReplacement[cand_name+ambiguous_dir];
                                if (j!==mr[4] || k!==mr[5]){
                                    mr[1] = mr[1] + 1;
                                }
                            }
                            if (newrule.aggregateDirReplacement[ambiguous_dir] === undefined) {
                                newrule.aggregateDirReplacement[ambiguous_dir] = [concreteDirection, 1, ambiguous_dir];
                            } else {
                                newrule.aggregateDirReplacement[ambiguous_dir][1] = newrule.aggregateDirReplacement[ambiguous_dir][1] + 1;
                            }

                            result.push(newrule);
                        }
                    }
                }
            }
            if (shouldremove) {
                result.splice(i, 1);
                i--;
            }
        }
    }


    for (var i = 0; i < result.length; i++) {
        //for each rule
        var cur_rule = result[i];
        if (cur_rule.movingReplacement === undefined) {
            continue;
        }
        var ambiguous_movement_dict = {};
        //strict first - matches movement direction to objects
        //for each property replacement in that rule
        for (var cand_name in cur_rule.movingReplacement) {
            if (cur_rule.movingReplacement.hasOwnProperty(cand_name)) {
                var replacementInfo = cur_rule.movingReplacement[cand_name];
                var concreteMovement = replacementInfo[0];
                var occurrenceCount = replacementInfo[1];
                var ambiguousMovement = replacementInfo[2];
                var ambiguousMovement_attachedObject = replacementInfo[3];

                if (occurrenceCount === 1) {
                    //do the replacement
                    for (var j = 0; j < cur_rule.rhs.length; j++) {
                        var cellRow_rhs = cur_rule.rhs[j];
                        for (var k = 0; k < cellRow_rhs.length; k++) {
                            var cell = cellRow_rhs[k];
                            concretizeMovingInCell(cell, ambiguousMovement, ambiguousMovement_attachedObject, concreteMovement);
                        }
                    }
                }

            }
        }

        //I don't fully understand why the following part is needed (and I wrote this yesterday), but it's not obviously malicious.
        var ambiguous_movement_names_dict = {};
        for (var cand_name in cur_rule.aggregateDirReplacement) {
            if (cur_rule.aggregateDirReplacement.hasOwnProperty(cand_name)) {
                var replacementInfo = cur_rule.aggregateDirReplacement[cand_name];
                var concreteMovement = replacementInfo[0];
                var occurrenceCount = replacementInfo[1];
                var ambiguousMovement = replacementInfo[2];
                //are both the following boolean bits necessary, or just the latter? ah well, no harm it seems.
                if ((ambiguousMovement in ambiguous_movement_names_dict) || (occurrenceCount !== 1)) {
                    ambiguous_movement_names_dict[ambiguousMovement] = "INVALID";
                } else {
                    ambiguous_movement_names_dict[ambiguousMovement] = concreteMovement
                }
            }
        }        

        //for each ambiguous word, if there's a single ambiguous movement specified in the whole lhs, then replace that wholesale
        for (var ambiguousMovement in ambiguous_movement_dict) {
            if (ambiguous_movement_dict.hasOwnProperty(ambiguousMovement) && ambiguousMovement !== "INVALID") {
                concreteMovement = ambiguous_movement_dict[ambiguousMovement];
                if (concreteMovement === "INVALID") {
                    continue;
                }
                for (var j = 0; j < cur_rule.rhs.length; j++) {
                    var cellRow_rhs = cur_rule.rhs[j];
                    for (var k = 0; k < cellRow_rhs.length; k++) {
                        var cell = cellRow_rhs[k];
                        concretizeMovingInCellByAmbiguousMovementName(cell, ambiguousMovement, concreteMovement);
                    }
                }
            }
        }

        
        //further replacements - if a movement word appears once on the left, can use to disambiguate remaining ones on the right
        for (var ambiguousMovement in ambiguous_movement_names_dict) {
            if (ambiguous_movement_names_dict.hasOwnProperty(ambiguousMovement) && ambiguousMovement !== "INVALID") {
                concreteMovement = ambiguous_movement_names_dict[ambiguousMovement];
                if (concreteMovement === "INVALID") {
                    continue;
                }
                for (var j = 0; j < cur_rule.rhs.length; j++) {
                    var cellRow_rhs = cur_rule.rhs[j];
                    for (var k = 0; k < cellRow_rhs.length; k++) {
                        var cell = cellRow_rhs[k];
                        concretizeMovingInCellByAmbiguousMovementName(cell, ambiguousMovement, concreteMovement);
                    }
                }
            }
        }
    }

    //if any properties remain on the RHSes, bleep loudly
    var rhsAmbiguousMovementsRemain = '';
    for (var i = 0; i < result.length; i++) {
        var cur_rule = result[i];
        delete result.movingReplacement;
        for (var j = 0; j < cur_rule.rhs.length; j++) {
            var cur_rulerow = cur_rule.rhs[j];
            for (var k = 0; k < cur_rulerow.length; k++) {
                var cur_cell = cur_rulerow[k];
                var movings = getMovings(state, cur_cell);
                if (movings.length > 0) {
                    rhsAmbiguousMovementsRemain = movings[0][1];
                }
            }
        }
    }


    if (rhsAmbiguousMovementsRemain.length > 0) {
        logError('This rule has an ambiguous movement on the right-hand side, \"' + rhsAmbiguousMovementsRemain + "\", that can't be inferred from the left-hand side.  (either for every ambiguous movement associated to an entity on the right there has to be a corresponding one on the left attached to the same entity, OR, if there's a single occurrence of a particular ambiguous movement on the left, all properties of the same movement attached to the same object on the right are assumed to be the same (or something like that)).", lineNumber);
        state.invalid=true;
    }

    return result;
}

function rephraseSynonyms(state, rule) {
    for (var i = 0; i < rule.lhs.length; i++) {
        var cellrow_l = rule.lhs[i];
        var cellrow_r = rule.rhs[i];
        for (var j = 0; j < cellrow_l.length; j++) {
            var cell_l = cellrow_l[j];
            for (var k = 1; k < cell_l.length; k += 2) {
                var name = cell_l[k];
                if (name in state.synonymsDict) {
                    cell_l[k] = state.synonymsDict[cell_l[k]];
                }
            }
            if (rule.rhs.length > 0) {
                var cell_r = cellrow_r[j];
                for (var k = 1; k < cell_r.length; k += 2) {
                    var name = cell_r[k];
                    if (name in state.synonymsDict) {
                        cell_r[k] = state.synonymsDict[cell_r[k]];
                    }
                }
            }
        }
    }
}

function atomizeAggregates(state, rule) {
    for (var i = 0; i < rule.lhs.length; i++) {
        var cellrow = rule.lhs[i];
        for (var j = 0; j < cellrow.length; j++) {
            var cell = cellrow[j];
            atomizeCellAggregates(state, cell, rule.lineNumber);
        }
    }
    for (var i = 0; i < rule.rhs.length; i++) {
        var cellrow = rule.rhs[i];
        for (var j = 0; j < cellrow.length; j++) {
            var cell = cellrow[j];
            atomizeCellAggregates(state, cell, rule.lineNumber);
        }
    }
}

function atomizeCellAggregates(state, cell, lineNumber) {
    for (var i = 0; i < cell.length; i += 2) {
        var dir = cell[i];
        var c = cell[i + 1];
        if (c in state.aggregatesDict) {
            if (dir === 'no') {
                logError("You cannot use 'no' to exclude the aggregate object " + c.toUpperCase() + " (defined using 'AND'), only regular objects, or properties (objects defined using 'OR').  If you want to do this, you'll have to write it out yourself the long way.", lineNumber);
            }
            var equivs = state.aggregatesDict[c];
            cell[i + 1] = equivs[0];
            for (var j = 1; j < equivs.length; j++) {
                cell.push(cell[i]); //push the direction
                cell.push(equivs[j]);
            }
        }
    }
}

function convertRelativeDirsToAbsolute(rule) {
    var forward = rule.direction;
    for (var i = 0; i < rule.lhs.length; i++) {
        var cellrow = rule.lhs[i];
        for (var j = 0; j < cellrow.length; j++) {
            var cell = cellrow[j];
            absolutifyRuleCell(forward, cell);
        }
    }
    for (var i = 0; i < rule.rhs.length; i++) {
        var cellrow = rule.rhs[i];
        for (var j = 0; j < cellrow.length; j++) {
            var cell = cellrow[j];
            absolutifyRuleCell(forward, cell);
        }
    }
}

var relativeDirs = ['^', 'v', '<', '>', 'parallel', 'perpendicular']; //used to index the following
//I use _par/_perp just to keep track of providence for replacement purposes later.
var relativeDict = {
    'right': ['up', 'down', 'left', 'right', 'horizontal_par', 'vertical_perp'],
    'up': ['left', 'right', 'down', 'up', 'vertical_par', 'horizontal_perp'],
    'down': ['right', 'left', 'up', 'down', 'vertical_par', 'horizontal_perp'],
    'left': ['down', 'up', 'right', 'left', 'horizontal_par', 'vertical_perp']
};

function absolutifyRuleCell(forward, cell) {
    for (var i = 0; i < cell.length; i += 2) {
        var c = cell[i];
        var index = relativeDirs.indexOf(c);
        if (index >= 0) {
            cell[i] = relativeDict[forward][index];
        }
    }
}
/*
	direction mask
	UP parseInt('%1', 2);
	DOWN parseInt('0', 2);
	LEFT parseInt('0', 2);
	RIGHT parseInt('0', 2);
	?  parseInt('', 2);
*/

var dirMasks = {
    'up': parseInt('00001', 2),
    'down': parseInt('00010', 2),
    'left': parseInt('00100', 2),
    'right': parseInt('01000', 2),
    'moving': parseInt('01111', 2),
    'no': parseInt('00011', 2),
    'randomdir': parseInt('00101', 2),
    'random': parseInt('10010', 2),
    'action': parseInt('10000', 2),
    '': parseInt('00000', 2)
};

function rulesToMask(state) {
    /*

    */
    var layerCount = state.collisionLayers.length;
    var layerTemplate = [];
    for (var i = 0; i < layerCount; i++) {
        layerTemplate.push(null);
    }

    for (var i = 0; i < state.rules.length; i++) {
        var rule = state.rules[i];
        for (var j = 0; j < rule.lhs.length; j++) {
            var cellrow_l = rule.lhs[j];
            var cellrow_r = rule.rhs[j];
            for (var k = 0; k < cellrow_l.length; k++) {
                var cell_l = cellrow_l[k];
                var layersUsed_l = layerTemplate.concat([]);
                var objectsPresent = new BitVec(STRIDE_OBJ);
                var objectsMissing = new BitVec(STRIDE_OBJ);
                var anyObjectsPresent = [];
                var movementsPresent = new BitVec(STRIDE_MOV);
                var movementsMissing = new BitVec(STRIDE_MOV);

                var objectlayers_l = new BitVec(STRIDE_MOV);
                for (var l = 0; l < cell_l.length; l += 2) {
                    var object_dir = cell_l[l];
                    if (object_dir === '...') {
                        objectsPresent = ellipsisPattern;
                        if (cell_l.length !== 2) {
                            logError("You can't have anything in with an ellipsis. Sorry.", rule.lineNumber);
                        } else if ((k === 0) || (k === cellrow_l.length - 1)) {
                            logError("There's no point in putting an ellipsis at the very start or the end of a rule", rule.lineNumber);
                        } else if (rule.rhs.length > 0) {
                            var rhscell = cellrow_r[k];
                            if (rhscell.length !== 2 || rhscell[0] !== '...') {
                                logError("An ellipsis on the left must be matched by one in the corresponding place on the right.", rule.lineNumber);
                            }
                        }
                        break;
                    } else if (object_dir === 'random') {
                        logError("'random' cannot be matched on the left-hand side, it can only appear on the right", rule.lineNumber);
                        continue;
                    }

                    var object_name = cell_l[l + 1];
                    var object = state.objects[object_name];
                    var objectMask = state.objectMasks[object_name];
                    if (object) {
                        var layerIndex = object.layer | 0;
                    } else {
                        var layerIndex = state.propertiesSingleLayer[object_name];
                    }

                    if (typeof(layerIndex) === "undefined") {
                        logError("Oops!  " + object_name.toUpperCase() + " not assigned to a layer.", rule.lineNumber);
                    }

                    if (object_dir === 'no') {
                        objectsMissing.ior(objectMask);
                    } else {
                        var existingname = layersUsed_l[layerIndex];
                        if (existingname !== null) {
                            rule.discard = [object_name.toUpperCase(), existingname.toUpperCase()];
                        }

                        layersUsed_l[layerIndex] = object_name;

                        if (object) {
                            objectsPresent.ior(objectMask);
                            objectlayers_l.ishiftor(0x1f, 5 * layerIndex);
                        } else {
                            anyObjectsPresent.push(objectMask);
                        }

                        if (object_dir === 'stationary') {
                            movementsMissing.ishiftor(0x1f, 5 * layerIndex);
                        } else {
                            movementsPresent.ishiftor(dirMasks[object_dir], 5 * layerIndex);
                        }
                    }
                }

                if (rule.rhs.length > 0) {
                    var rhscell = cellrow_r[k];
                    var lhscell = cellrow_l[k];
                    if (rhscell[0] === '...' && lhscell[0] !== '...') {
                        logError("An ellipsis on the right must be matched by one in the corresponding place on the left.", rule.lineNumber);
                    }
                    for (var l = 0; l < rhscell.length; l += 2) {
                        var content = rhscell[l];
                        if (content === '...') {
                            if (rhscell.length !== 2) {
                                logError("You can't have anything in with an ellipsis. Sorry.", rule.lineNumber);
                            }
                        }
                    }
                }

                if (objectsPresent === ellipsisPattern) {
                    cellrow_l[k] = ellipsisPattern;
                    continue;
                } else {
                    cellrow_l[k] = new CellPattern([objectsPresent, objectsMissing, anyObjectsPresent, movementsPresent, movementsMissing, null]);
                }

                //if X no X, then cancel
                if (objectsPresent.anyBitsInCommon(objectsMissing)){
                    //if I'm about the remove the last representative of this line number, throw an error
                    var ln = rule.lineNumber;
                    if ( (i>0 && state.rules[i-1].lineNumber===ln) || ( (i+1<state.rules.length) && state.rules[i+1].lineNumber===ln)){
                        //all good
                    } else {
                        logWarning('This rule has some content of the form "X no X" (either directly or maybe indirectly - check closely how the terms are defined if nothing stands out) which can never match and so the rule is getting removed during compilation.', rule.lineNumber);
                    }
                    state.rules.splice(i,1);
                    i--;
                    continue;
                }
                
                if (rule.rhs.length === 0) {
                    continue;
                }

                var cell_r = cellrow_r[k];
                var layersUsed_r = layerTemplate.concat([]);
                var layersUsedRand_r = layerTemplate.concat([]);

                var objectsClear = new BitVec(STRIDE_OBJ);
                var objectsSet = new BitVec(STRIDE_OBJ);
                var movementsClear = new BitVec(STRIDE_MOV);
                var movementsSet = new BitVec(STRIDE_MOV);

                var objectlayers_r = new BitVec(STRIDE_MOV);
                var randomMask_r = new BitVec(STRIDE_OBJ);
                var postMovementsLayerMask_r = new BitVec(STRIDE_MOV);
                var randomDirMask_r = new BitVec(STRIDE_MOV);
                for (var l = 0; l < cell_r.length; l += 2) {
                    var object_dir = cell_r[l];
                    var object_name = cell_r[l + 1];

                    if (object_dir === '...') {
                        //logError("spooky ellipsis found! (should never hit this)");
                        break;
                    } else if (object_dir === 'random') {
                        if (object_name in state.objectMasks) {
                            var mask = state.objectMasks[object_name];
                            randomMask_r.ior(mask);
                            var values;
                            if (state.propertiesDict.hasOwnProperty(object_name)) {
                                values = state.propertiesDict[object_name];
                            } else {
                                values = [object_name];
                            }
                            for (var m = 0; m < values.length; m++) {
                                var subobject = values[m];
                                var layerIndex = state.objects[subobject].layer | 0;
                                var existingname = layersUsed_r[layerIndex];
                                if (existingname !== null) {
                                    var o1 = subobject.toUpperCase();
                                    var o2 = existingname.toUpperCase();
                                    if (o1 !== o2) {
                                        logWarning("This rule may try to spawn a " + o1 + " with random, but also requires a " + o2 + " be here, which is on the same layer - they shouldn't be able to coexist!", rule.lineNumber);
                                    }
                                }

                                layersUsedRand_r[layerIndex] = subobject;
                            }

                        } else {
                            logError('You want to spawn a random "' + object_name.toUpperCase() + '", but I don\'t know how to do that', rule.lineNumber);
                        }
                        continue;
                    }

                    var object = state.objects[object_name];
                    var objectMask = state.objectMasks[object_name];
                    if (object) {
                        var layerIndex = object.layer | 0;
                    } else {
                        var layerIndex = state.propertiesSingleLayer[object_name];
                    }


                    if (object_dir == 'no') {
                        objectsClear.ior(objectMask);
                    } else {
                        var existingname = layersUsed_r[layerIndex];
                        if (existingname === null) {
                            existingname = layersUsedRand_r[layerIndex];
                        }

                        if (existingname !== null) {
                            if (rule.hasOwnProperty('discard')) {

                            } else {
                                logError('Rule matches object types that can\'t overlap: "' + object_name.toUpperCase() + '" and "' + existingname.toUpperCase() + '".', rule.lineNumber);
                            }
                        }

                        layersUsed_r[layerIndex] = object_name;

                        if (object_dir.length > 0) {
                            postMovementsLayerMask_r.ishiftor(0x1f, 5 * layerIndex);
                        }

                        var layerMask = state.layerMasks[layerIndex];

                        if (object) {
                            objectsSet.ibitset(object.id);
                            objectsClear.ior(layerMask);
                            objectlayers_r.ishiftor(0x1f, 5 * layerIndex);
                        } else {
                            // shouldn't need to do anything here...
                        }
                        //possibility - if object not present on lhs in same position, clear movement
                        if (object_dir === 'stationary') {
                            movementsClear.ishiftor(0x1f, 5 * layerIndex);
                        }                
                        if (object_dir === 'randomdir') {
                            randomDirMask_r.ishiftor(dirMasks[object_dir], 5 * layerIndex);
                        } else {
                            movementsSet.ishiftor(dirMasks[object_dir], 5 * layerIndex);
                        };
                    }
                }

                //I don't know why these two ifs here are needed.
                if (!(objectsPresent.bitsSetInArray(objectsSet.data))) {
                    objectsClear.ior(objectsPresent); // clear out old objects
                }
                if (!(movementsPresent.bitsSetInArray(movementsSet.data))) {
                    movementsClear.ior(movementsPresent); // ... and movements
                }

                /*
                for rules like this I want to clear movements on newly-spawned entities
                    [ >  Player | Crate ] -> [  >  Player | > Crate  ]
                    [ > Player | ] -> [ Crate | Player ]

                WITHOUT havin this rule remove movements
                    [ > Player | ] -> [ Crate | Player ]
                (bug #492)
                */
               
                for (var l = 0; l < layerCount; l++) {
                    if (layersUsed_l[l] !== null && layersUsed_r[l] === null) {
                        // a layer matched on the lhs, but not on the rhs
                        objectsClear.ior(state.layerMasks[l]);
                        postMovementsLayerMask_r.ishiftor(0x1f, 5 * l);
                    }
                }

                objectlayers_l.iclear(objectlayers_r);

                postMovementsLayerMask_r.ior(objectlayers_l);
                if (!objectsClear.iszero() || !objectsSet.iszero() || !movementsClear.iszero() || !movementsSet.iszero() || !postMovementsLayerMask_r.iszero() || !randomMask_r.iszero() || !randomDirMask_r.iszero()) {
                    // only set a replacement if something would change
                    cellrow_l[k].replacement = new CellReplacement([objectsClear, objectsSet, movementsClear, movementsSet, postMovementsLayerMask_r, randomMask_r, randomDirMask_r]);
                } 
            }
        }
    }
}

function cellRowMasks(rule) {
    var ruleMasks = [];
    var lhs = rule[1];
    for (var i = 0; i < lhs.length; i++) {
        var cellRow = lhs[i];
        var rowMask = new BitVec(STRIDE_OBJ);
        for (var j = 0; j < cellRow.length; j++) {
            if (cellRow[j] === ellipsisPattern)
                continue;
            rowMask.ior(cellRow[j].objectsPresent);
        }
        ruleMasks.push(rowMask);
    }
    return ruleMasks;
}

function cellRowMasks_Movements(rule){
    var ruleMasks_mov = [];
    var lhs = rule[1];
    for (var i = 0; i < lhs.length; i++) {
        var cellRow = lhs[i];
        var rowMask = new BitVec(STRIDE_MOV);
        for (var j = 0; j < cellRow.length; j++) {
            if (cellRow[j] === ellipsisPattern)
                continue;
            rowMask.ior(cellRow[j].movementsPresent);
        }
        ruleMasks_mov.push(rowMask);
    }
    return ruleMasks_mov;
}

function collapseRules(groups) {
    for (var gn = 0; gn < groups.length; gn++) {
        var rules = groups[gn];
        for (var i = 0; i < rules.length; i++) {
            var oldrule = rules[i];
            var newrule = [0, [], oldrule.rhs.length > 0, oldrule.lineNumber /*ellipses,group number,rigid,commands,randomrule,[cellrowmasks]*/ ];
            var ellipses = [];
            for (var j = 0; j < oldrule.lhs.length; j++) {
                ellipses.push(false);
            }

            newrule[0] = dirMasks[oldrule.direction];
            for (var j = 0; j < oldrule.lhs.length; j++) {
                var cellrow_l = oldrule.lhs[j];
                for (var k = 0; k < cellrow_l.length; k++) {
                    if (cellrow_l[k] === ellipsisPattern) {
                        if (ellipses[j]) {
                            logError("You can't use two ellipses in a single cell match pattern.  If you really want to, please implement it yourself and send me a patch :) ", oldrule.lineNumber);
                        }
                        ellipses[j] = true;
                    }
                }
                newrule[1][j] = cellrow_l;
            }
            newrule.push(ellipses);
            newrule.push(oldrule.groupNumber);
            newrule.push(oldrule.rigid);
            newrule.push(oldrule.commands);
            newrule.push(oldrule.randomRule);
            newrule.push(cellRowMasks(newrule));
            newrule.push(cellRowMasks_Movements(newrule));
            newrule.push(oldrule.globalRule);
            rules[i] = new Rule(newrule);
        }
    }
    matchCache = {}; // clear match cache so we don't slowly leak memory
}



function ruleGroupDiscardOverlappingTest(ruleGroup) {
    if (ruleGroup.length === 0)
        return;

    for (var i = 0; i < ruleGroup.length; i++) {
        var rule = ruleGroup[i];
        if (rule.hasOwnProperty('discard')) {
            ruleGroup.splice(i, 1);

            //if rule before isn't of same linenumber, and rule after isn't of same linenumber, 
            //then a rule has been totally erased and you should throw an error!
            if ( (i===0 || ruleGroup[i-1].lineNumber !==  rule.lineNumber ) 
                && (i<ruleGroup.length-1 && ruleGroup[i+1].lineNumber !==  rule.lineNumber) || ruleGroup.length===0) {
                var example = rule['discard'];
                
                logError(example[0] + ' and ' + example[1] + ' can never overlap, but this rule requires that to happen.', rule.lineNumber);
            }
            i--;
        }
    }
}

function arrangeRulesByGroupNumber(state) {
    var aggregates = {};
    var aggregates_late = {};
    for (var i = 0; i < state.rules.length; i++) {
        var rule = state.rules[i];
        var targetArray = aggregates;
        if (rule.late) {
            targetArray = aggregates_late;
        }

        if (targetArray[rule.groupNumber] == undefined) {
            targetArray[rule.groupNumber] = [];
        }
        targetArray[rule.groupNumber].push(rule);
    }

    var result = [];
    for (var groupNumber in aggregates) {
        if (aggregates.hasOwnProperty(groupNumber)) {
            var ruleGroup = aggregates[groupNumber];
            ruleGroupDiscardOverlappingTest(ruleGroup);
            if (ruleGroup.length > 0) {
                result.push(ruleGroup);
            }
        }
    }
    var result_late = [];
    for (var groupNumber in aggregates_late) {
        if (aggregates_late.hasOwnProperty(groupNumber)) {
            var ruleGroup = aggregates_late[groupNumber];
            ruleGroupDiscardOverlappingTest(ruleGroup);
            if (ruleGroup.length > 0) {
                result_late.push(ruleGroup);
            }
        }
    }
    state.rules = result;

    //check that there're no late movements with direction requirements on the lhs
    state.lateRules = result_late;
}

function generateRigidGroupList(state) {
	var rigidGroupIndex_to_GroupIndex=[];
	var groupIndex_to_RigidGroupIndex=[];
	var groupNumber_to_GroupIndex=[];
	var groupNumber_to_RigidGroupIndex=[];
	var rigidGroups=[];
	for (var i=0;i<state.rules.length;i++) {
		var ruleset=state.rules[i];
		var rigidFound=false;
		for (var j=0;j<ruleset.length;j++) {
			var rule=ruleset[j];
			if (rule.isRigid) {
				rigidFound=true;
			}
		}
		rigidGroups[i]=rigidFound;
		if (rigidFound) {
			var groupNumber=ruleset[0].groupNumber;
			groupNumber_to_GroupIndex[groupNumber]=i;
			var rigid_group_index = rigidGroupIndex_to_GroupIndex.length;
			groupIndex_to_RigidGroupIndex[i]=rigid_group_index;
			groupNumber_to_RigidGroupIndex[groupNumber]=rigid_group_index;
			rigidGroupIndex_to_GroupIndex.push(i);
		}
	}
	if (rigidGroupIndex_to_GroupIndex.length>60) {
		logError("There can't be more than 60 rigid groups (rule groups containing rigid members).",rules[0][0][3]);
	}

	state.rigidGroups=rigidGroups;
	state.rigidGroupIndex_to_GroupIndex=rigidGroupIndex_to_GroupIndex;
	state.groupNumber_to_RigidGroupIndex=groupNumber_to_RigidGroupIndex;
	state.groupIndex_to_RigidGroupIndex=groupIndex_to_RigidGroupIndex;
}

function getMaskFromName(state,name) {
	var objectMask=new BitVec(STRIDE_OBJ);
	if (name in state.objects) {
		var o=state.objects[name];
		objectMask.ibitset(o.id);
	}

	if (name in state.aggregatesDict) {
		var objectnames = state.aggregatesDict[name];
		for(var i=0;i<objectnames.length;i++) {
			var n=objectnames[i];
			var o = state.objects[n];
			objectMask.ibitset(o.id);
		}
	}

	if (name in state.propertiesDict) {
		var objectnames = state.propertiesDict[name];
		for(var i=0;i<objectnames.length;i++) {
			var n = objectnames[i];
			var o = state.objects[n];
			objectMask.ibitset(o.id);
		}
	}

	if (name in state.synonymsDict) {
		var n = state.synonymsDict[name];
		var o = state.objects[n];
		objectMask.ibitset(o.id);
	}

	if (!state.metadata.includes("nokeyboard") && objectMask.iszero()) {
		logErrorNoLine("error, didn't find any object called player, either in the objects section, or the legends section. there must be a player!");
	}
	return objectMask;
}

function generateMasks(state) {
    state.playerMask = getMaskFromName(state, 'player');

    var layerMasks = [];
    var layerCount = state.collisionLayers.length;
    for (var layer = 0; layer < layerCount; layer++) {
        var layerMask = new BitVec(STRIDE_OBJ);
        for (var j = 0; j < state.objectCount; j++) {
            var n = state.idDict[j];
            var o = state.objects[n];
            if (o.layer == layer) {
                layerMask.ibitset(o.id);
            }
        }
        layerMasks.push(layerMask);
    }
    state.layerMasks = layerMasks;

    var objectMask = {};
    for (var n in state.objects) {
        if (state.objects.hasOwnProperty(n)) {
            var o = state.objects[n];
            objectMask[n] = new BitVec(STRIDE_OBJ);
            objectMask[n].ibitset(o.id);
        }
    }

    // Synonyms can depend on properties, and properties can depend on synonyms.
    // Process them in order by combining & sorting by linenumber.

    var synonyms_and_properties = state.legend_synonyms.concat(state.legend_properties);
    synonyms_and_properties.sort(function(a, b) {
        return a.lineNumber - b.lineNumber;
    });

    for (var i = 0; i < synonyms_and_properties.length; i++) {
        var synprop = synonyms_and_properties[i];
        if (synprop.length == 2) {
            // synonym (a = b)
            objectMask[synprop[0]] = objectMask[synprop[1]];
        } else {
            // property (a = b or c)
            var val = new BitVec(STRIDE_OBJ);
            for (var j = 1; j < synprop.length; j++) {
                var n = synprop[j];
                val.ior(objectMask[n]);
            }
            objectMask[synprop[0]] = val;
        }
    }

    //use \n as a delimeter for internal-only objects
    var all_obj = new BitVec(STRIDE_OBJ);
    all_obj.inot();
    objectMask["\nall\n"] = all_obj;

    state.objectMasks = objectMask;
}

function checkObjectsAreLayered(state) {
    for (var n in state.objects) {
        if (state.objects.hasOwnProperty(n)) {
            var found = false;
            for (var i = 0; i < state.collisionLayers.length; i++) {
                var layer = state.collisionLayers[i];
                for (var j = 0; j < layer.length; j++) {
                    if (layer[j] === n) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    break;
                }
            }
            if (found === false) {
                var o = state.objects[n];
                logError('Object "' + n.toUpperCase() + '" has been defined, but not assigned to a layer.', o.lineNumber);
            }
        }
    }
}

function twiddleMetaData(state, update = false) {
	var newmetadata;

	if (!update) {
		newmetadata = {};
		for (var i=0;i<state.metadata.length;i+=2) {
			var key = state.metadata[i];
			var val = state.metadata[i+1];
			newmetadata[key]=val;
		}
	} else {
		newmetadata = state.metadata;
	}

	if (newmetadata.flickscreen!==undefined) {
		var val = newmetadata.flickscreen;
		var coords = val.split('x');
		var intcoords = [parseInt(coords[0]),parseInt(coords[1])];
		newmetadata.flickscreen=intcoords;
	}
	if (newmetadata.zoomscreen!==undefined) {
		var val = newmetadata.zoomscreen;
		var coords = val.split('x');
		var intcoords = [parseInt(coords[0]),parseInt(coords[1])];
		newmetadata.zoomscreen=intcoords;
	}
	if (newmetadata.smoothscreen!==undefined) {
		var val = newmetadata.smoothscreen;
		var args = val.split(/\s+/);

		var validArguments = true

		if (args.length < 1) {
			logErrorNoLine('smoothscreen given no arguments but expects at least 1: smoothscreen [flick] WxH [IxJ] [S]')
			validArguments = false
		} else if (args.length > 4) {
			logErrorNoLine('smoothscreen given ' + args.length + ' arguments but expects at most 4: smoothscreen [flick] WxH [IxJ] [S]')
			validArguments = false
		}

		const smoothscreen = {
			screenSize: { width: 0, height: 0 },
			boundarySize: { width: 1, height: 1 },
			cameraSpeed: 0.125,
			flick: false,
			debug: !!newmetadata.smoothscreen_debug
		}

		if (args[0] === 'flick') {
			smoothscreen.flick = true
			args.shift()
		}

		const screenSizeMatch = args[0].match(/^(?<width>\d+)x(?<height>\d+)$/)
		if (screenSizeMatch) {
			smoothscreen.screenSize.width = parseInt(screenSizeMatch.groups.width)
			smoothscreen.screenSize.height = parseInt(screenSizeMatch.groups.height)

			if (smoothscreen.flick) {
				smoothscreen.boundarySize.width = smoothscreen.screenSize.width
				smoothscreen.boundarySize.height = smoothscreen.screenSize.height
			}
		} else {
			logErrorNoLine('smoothscreen given first argument ' + args[0] + ' but must be formatted WxH where W and H are integers')
			validArguments = false
		}

		if (args.length > 1) {
			const boundarySizeMatch = args[1].match(/^(?<width>\d+)x(?<height>\d+)$/)
			if (boundarySizeMatch) {
				smoothscreen.boundarySize.width = parseInt(boundarySizeMatch.groups.width)
				smoothscreen.boundarySize.height = parseInt(boundarySizeMatch.groups.height)
			} else {
				logErrorNoLine('smoothscreen given second argument ' + args[1] + ' but must be formatted IxJ where I and J are integers')
				validArguments = false
			}
		}

		if (args.length > 2) {
			const cameraSpeedMatch = args[2].match(/^(?<speed>\d+(\.\d+)?)$/)
			if (cameraSpeedMatch) {
				smoothscreen.cameraSpeed = clamp(parseFloat(cameraSpeedMatch.groups.speed), 0, 1)
			} else {
				logErrorNoLine('smoothscreen given third argument ' + args[2] + ' but must be a number')
				validArguments = false
			}
		}

		if (validArguments) {
			newmetadata.smoothscreen = smoothscreen;
		} else {
			delete newmetadata.smoothscreen
		}
	}

	state.metadata=newmetadata;

	if (!update) {
		state.default_metadata = deepClone(newmetadata);
	}
}

function processWinConditions(state) {
    //	[-1/0/1 (no,some,all),ob1,ob2] (ob2 is background by default)
    var newconditions = [];
    for (var i = 0; i < state.winconditions.length; i++) {
        var wincondition = state.winconditions[i];
        if (wincondition.length == 0) {
            return;
        }
        var num = 0;
        switch (wincondition[0].toLowerCase()) {
            case 'no':
                { num = -1; break; }
            case 'all':
                { num = 1; break; }
        }

        var lineNumber = wincondition[wincondition.length - 1];

        var n1 = wincondition[1];
        var n2;
        if (wincondition.length == 5) {
            n2 = wincondition[3];
        } else {
            n2 = '\nall\n';
        }

        var mask1 = 0;
        var mask2 = 0;
        if (n1 in state.objectMasks) {
            mask1 = state.objectMasks[n1];
        } else {
            logError('Unwelcome term "' + n1 + '" found in win condition. Win conditions objects have to be objects or properties (defined using "or", in terms of other properties)', lineNumber);
        }
        if (n2 in state.objectMasks) {
            mask2 = state.objectMasks[n2];
        } else {
            logError('Unwelcome term "' + n2 + '" found in win condition. Win conditions objects have to be objects or properties (defined using "or", in terms of other properties)', lineNumber);
        }
        var newcondition = [num, mask1, mask2, lineNumber];
        newconditions.push(newcondition);
    }
    state.winconditions = newconditions;
}

function printCellRow(cellRow) {
    var result = "[ ";
    for (var i = 0; i < cellRow.length; i++) {
        if (i > 0) {
            result += "| ";
        }
        var cell = cellRow[i];
        for (var j = 0; j < cell.length; j += 2) {
            var direction = cell[j];
            var object = cell[j + 1]
            if (direction === "...") {
                result += direction + " ";
            } else {
                result += direction + " " + object + " ";
            }
        }
    }
    result += "] ";
    return result;
}

function cacheRuleStringRep(rule) {
	var result="(<a onclick=\"jumpToLine('"+ rule.lineNumber.toString() + "');\"  href=\"javascript:void(0);\">"+rule.lineNumber+"</a>) "+ rule.direction.toString().toUpperCase()+" ";
	if (rule.rigid) {
		result = "RIGID "+result+" ";
	}
	if (rule.randomRule) {
		result = "RANDOM "+result+" ";
	}
	if (rule.globalRule) {
		result = "GLOBAL "+result+" ";
	}
	if (rule.late) {
		result = "LATE "+result+" ";
	}
	for (var i=0;i<rule.lhs.length;i++) {
		var cellRow = rule.lhs[i];
		result = result + printCellRow(cellRow);
	}
	result = result + "-> ";
	for (var i=0;i<rule.rhs.length;i++) {
		var cellRow = rule.rhs[i];
		result = result + printCellRow(cellRow);
	}
	for (var i=0;i<rule.commands.length;i++) {
		var command = rule.commands[i];
		if (command.length===1) {
			result = result +command[0].toString();
		} else {
			result = result + '('+command[0].toString()+", "+command[1].toString()+') ';			
		}
	}
	//print commands next
	rule.stringRep=result;
}

function cacheAllRuleNames(state) {

    for (var i = 0; i < state.rules.length; i++) {
        var rule = state.rules[i];
        cacheRuleStringRep(rule);
    }
}

function printRules(state) {
    var output = "";
    var loopIndex = 0;
    var loopEnd = -1;
    var discardcount = 0;
    for (var i = 0; i < state.rules.length; i++) {
        var rule = state.rules[i];
        if (loopIndex < state.loops.length) {
            if (state.loops[loopIndex][0] < rule.lineNumber) {
                output += "STARTLOOP<br>";
                loopIndex++;
                if (loopIndex < state.loops.length) { // don't die with mismatched loops
                    loopEnd = state.loops[loopIndex][0];
                    loopIndex++;
                }
            }
        }
        if (loopEnd !== -1 && loopEnd < rule.lineNumber) {
            output += "ENDLOOP<br>";
            loopEnd = -1;
        }
        if (rule.hasOwnProperty('discard')) {
            discardcount++;
        } else {
            output += rule.stringRep + "<br>";
        }
    }
    if (loopEnd !== -1) { // no more rules after loop end
        output += "ENDLOOP<br>";
    }
    output += "===========<br>";
    output = "<br>Rule Assembly : (" + (state.rules.length - discardcount) + " rules)<br>===========<br>" + output;
    consolePrint(output);
}

function removeDuplicateRules(state) {
    var record = {};
    var newrules = [];
    var lastgroupnumber = -1;
    for (var i = state.rules.length - 1; i >= 0; i--) {
        var r = state.rules[i];
        var groupnumber = r.groupNumber;
        if (groupnumber !== lastgroupnumber) {
            record = {};
        }
        var r_string = r.stringRep;
        if (record.hasOwnProperty(r_string)) {
            state.rules.splice(i, 1);
        } else {
            record[r_string] = true;
        }
        lastgroupnumber = groupnumber;
    }
}

function generateLoopPoints(state) {
    var loopPoint = {};
    var loopPointIndex = 0;
    var outside = true;
    var source = 0;
    var target = 0;
    if (state.loops.length % 2 === 1) {
        logErrorNoLine("have to have matching number of  'startLoop' and 'endLoop' loop points.");
    }

    for (var j = 0; j < state.loops.length; j++) {
        var loop = state.loops[j];
        for (var i = 0; i < state.rules.length; i++) {
            var ruleGroup = state.rules[i];

            var firstRule = ruleGroup[0];
            var lastRule = ruleGroup[ruleGroup.length - 1];

            var firstRuleLine = firstRule.lineNumber;
            var lastRuleLine = lastRule.lineNumber;

            if (outside) {
                if (firstRuleLine >= loop[0]) {
                    target = i;
                    outside = false;
                    if (loop[1] === -1) {
                        logErrorNoLine("Need have to have matching number of  'startLoop' and 'endLoop' loop points.");
                    }
                    break;
                }
            } else {
                if (firstRuleLine >= loop[0]) {
                    source = i - 1;
                    loopPoint[source] = target;
                    outside = true;
                    if (loop[1] === 1) {
                        logErrorNoLine("Need have to have matching number of  'startLoop' and 'endLoop' loop points.");
                    }
                    break;
                }
            }
        }
    }
    if (outside === false) {
        var source = state.rules.length;
        loopPoint[source] = target;
    } else {}
    state.loopPoint = loopPoint;

    loopPoint = {};
    outside = true;
    for (var j = 0; j < state.loops.length; j++) {
        var loop = state.loops[j];
        for (var i = 0; i < state.lateRules.length; i++) {
            var ruleGroup = state.lateRules[i];

            var firstRule = ruleGroup[0];
            var lastRule = ruleGroup[ruleGroup.length - 1];

            var firstRuleLine = firstRule.lineNumber;
            var lastRuleLine = lastRule.lineNumber;

            if (outside) {
                if (firstRuleLine >= loop[0]) {
                    target = i;
                    outside = false;
                    if (loop[1] === -1) {
                        logErrorNoLine("Need have to have matching number of  'startLoop' and 'endLoop' loop points.");
                    }
                    break;
                }
            } else {
                if (firstRuleLine >= loop[0]) {
                    source = i - 1;
                    loopPoint[source] = target;
                    outside = true;
                    if (loop[1] === 1) {
                        logErrorNoLine("Need have to have matching number of  'startLoop' and 'endLoop' loop points.");
                    }
                    break;
                }
            }
        }
    }
    if (outside === false) {
        var source = state.lateRules.length;
        loopPoint[source] = target;
    } else {}
    state.lateLoopPoint = loopPoint;
}

var soundEvents = ["titlescreen", "startgame", "cancel", "endgame", "startlevel", "undo", "restart", "endlevel", "showmessage", "closemessage", "sfx0", "sfx1", "sfx2", "sfx3", "sfx4", "sfx5", "sfx6", "sfx7", "sfx8", "sfx9", "sfx10"];
var soundMaskedEvents = ["create", "destroy", "move", "cantmove", "action"];
var soundVerbs = soundEvents.concat(soundMaskedEvents);


function validSeed(seed) {
    return /^\s*\d+\s*$/.exec(seed) !== null;
}


var soundDirectionIndicatorMasks = {
    'up': parseInt('00001', 2),
    'down': parseInt('00010', 2),
    'left': parseInt('00100', 2),
    'right': parseInt('01000', 2),
    'horizontal': parseInt('01100', 2),
    'vertical': parseInt('00011', 2),
    'orthogonal': parseInt('01111', 2),
    '___action____': parseInt('10000', 2)
};

var soundDirectionIndicators = ["up", "down", "left", "right", "horizontal", "vertical", "orthogonal", "___action____"];


function generateSoundData(state) {
    var sfx_Events = {};
    var sfx_CreationMasks = [];
    var sfx_DestructionMasks = [];
    var sfx_MovementMasks = [];
    var sfx_MovementFailureMasks = [];

    for (var i = 0; i < state.sounds.length; i++) {
        var sound = state.sounds[i];
        if (sound.length <= 1) {
            continue;
        }
        var lineNumber = sound[sound.length - 1];

        if (sound.length === 2) {
            logError('incorrect sound declaration.', lineNumber);
            continue;
        }

        if (soundEvents.indexOf(sound[0]) >= 0) {
            if (sound.length > 4) {
                logError("too much stuff to define a sound event.", lineNumber);
            } else {
                //out of an abundance of caution, doing a fallback warning rather than expanding the scope of the error #779
                if (sound.length > 3) {
                    logWarning("too much stuff to define a sound event.", lineNumber);
                }
            }
            var seed = sound[1];
            if (validSeed(seed)) {
                if (sfx_Events[sound[0]] !== undefined) {
                    logWarning(sound[0].toUpperCase() + " already declared.", lineNumber);
                }
                sfx_Events[sound[0]] = sound[1];
            } else {
                logError("Expecting sfx data, instead found \"" + sound[1] + "\".", lineNumber);
            }
        } else {
            var target = sound[0].trim();
            var verb = sound[1].trim();
            var directions = sound.slice(2, sound.length - 2);
            if (directions.length > 0 && (verb !== 'move' && verb !== 'cantmove')) {
                logError('incorrect sound declaration.', lineNumber);
            }

            if (verb === 'action') {
                verb = 'move';
                directions = ['___action____'];
            }

            if (directions.length == 0) {
                directions = ["orthogonal"];
            }
            var seed = sound[sound.length - 2];

            if (target in state.aggregatesDict) {
                logError('cannot assign sound events to aggregate objects (declared with "and"), only to regular objects, or properties, things defined in terms of "or" ("' + target + '").', lineNumber);
            } else if (target in state.objectMasks) {

            } else {
                logError('Object "' + target + '" not found.', lineNumber);
            }

            var objectMask = state.objectMasks[target];

            var directionMask = 0;
            for (var j = 0; j < directions.length; j++) {
                directions[j] = directions[j].trim();
                var direction = directions[j];
                if (soundDirectionIndicators.indexOf(direction) === -1) {
                    logError('Was expecting a direction, instead found "' + direction + '".', lineNumber);
                } else {
                    var soundDirectionMask = soundDirectionIndicatorMasks[direction];
                    directionMask |= soundDirectionMask;
                }
            }


            var targets = [target];
            var modified = true;
            while (modified) {
                modified = false;
                for (var k = 0; k < targets.length; k++) {
                    var t = targets[k];
                    if (t in state.synonymsDict) {
                        targets[k] = state.synonymsDict[t];
                        modified = true;
                    } else if (t in state.propertiesDict) {
                        modified = true;
                        var props = state.propertiesDict[t];
                        targets.splice(k, 1);
                        k--;
                        for (var l = 0; l < props.length; l++) {
                            targets.push(props[l]);
                        }
                    }
                }
            }

            if (verb === 'move' || verb === 'cantmove') {
                for (var j = 0; j < targets.length; j++) {
                    var targetName = targets[j];
                    var targetDat = state.objects[targetName];
                    var targetLayer = targetDat.layer;
                    var shiftedDirectionMask = new BitVec(STRIDE_MOV);
                    shiftedDirectionMask.ishiftor(directionMask, 5 * targetLayer);

                    var o = {
                        objectMask: objectMask,
                        directionMask: shiftedDirectionMask,
                        seed: seed
                    };

                    if (verb === 'move') {
                        sfx_MovementMasks.push(o);
                    } else {
                        sfx_MovementFailureMasks.push(o);
                    }
                }
            }


            if (!validSeed(seed)) {
                logError("Expecting sfx data, instead found \"" + seed + "\".", lineNumber);
            }

            var targetArray;
            switch (verb) {
                case "create":
                    {
                        var o = {
                            objectMask: objectMask,
                            seed: seed
                        }
                        sfx_CreationMasks.push(o);
                        break;
                    }
                case "destroy":
                    {
                        var o = {
                            objectMask: objectMask,
                            seed: seed
                        }
                        sfx_DestructionMasks.push(o);
                        break;
                    }
            }
        }
    }

    state.sfx_Events = sfx_Events;
    state.sfx_CreationMasks = sfx_CreationMasks;
    state.sfx_DestructionMasks = sfx_DestructionMasks;
    state.sfx_MovementMasks = sfx_MovementMasks;
    state.sfx_MovementFailureMasks = sfx_MovementFailureMasks;
}


function formatHomePage(state) {
    if ('background_color' in state.metadata) {
        state.bgcolor = colorToHex(colorPalette, state.metadata.background_color);
    } else {
        state.bgcolor = "#000000";
    }
    if ('text_color' in state.metadata) {
        state.fgcolor = colorToHex(colorPalette, state.metadata.text_color);
    } else {
        state.fgcolor = "#FFFFFF";
    }

    if (isColor(state.fgcolor) === false) {
        logError("text_color in incorrect format - found " + state.fgcolor + ", but I expect a color name (like 'pink') or hex-formatted color (like '#1412FA').  Defaulting to white.")
        state.fgcolor = "#FFFFFF";
    }
    if (isColor(state.bgcolor) === false) {
        logError("background_color in incorrect format - found " + state.bgcolor + ", but I expect a color name (like 'pink') or hex-formatted color (like '#1412FA').  Defaulting to black.")
        state.bgcolor = "#000000";
    }

    if (canSetHTMLColors) {

        if ('background_color' in state.metadata) {
            document.body.style.backgroundColor = state.bgcolor;
        }

        if ('text_color' in state.metadata) {
            var separator = document.getElementById("separator");
            if (separator != null) {
                separator.style.color = state.fgcolor;
            }

            var h1Elements = document.getElementsByTagName("a");
            for (var i = 0; i < h1Elements.length; i++) {
                h1Elements[i].style.color = state.fgcolor;
            }

            var h1Elements = document.getElementsByTagName("h1");
            for (var i = 0; i < h1Elements.length; i++) {
                h1Elements[i].style.color = state.fgcolor;
            }
        }
    }

    if ('homepage' in state.metadata) {
        var url = state.metadata['homepage'];
        url = url.replace("http://", "");
        url = url.replace("https://", "");
        state.metadata['homepage'] = url;
    }
}

var MAX_ERRORS = 5;

function loadFile(str) {
	var processor = new codeMirrorFn();
	var state = processor.startState();

	var lines = str.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		state.lineNumber = i + 1;
		var ss = new CodeMirror.StringStream(line, 4);
		do {
			processor.token(ss, state);

			if (errorCount>MAX_ERRORS) {
				consolePrint("too many errors, aborting compilation");
				return;
			}
		}		
		while (ss.eol() === false);
	}

    // delete state.lineNumber;

	generateExtraMembers(state);
	generateMasks(state);
	levelsToArray(state);
	extractSections(state);
    rulesToArray(state);
    
    if (state.invalid>0){
        return null;
    }

	cacheAllRuleNames(state);

    removeDuplicateRules(state);
    
    if (state.invalid>0){
        return null;
    }

	convertSectionNamesToIndices(state);

	rulesToMask(state);

	
	if (debugMode) {
		printRules(state);
	}

	arrangeRulesByGroupNumber(state);
	collapseRules(state.rules);
	collapseRules(state.lateRules);

    generateRigidGroupList(state);

	processWinConditions(state);
	checkObjectsAreLayered(state);

	twiddleMetaData(state);
	
	generateExtraMembersPart2(state);

	generateLoopPoints(state);

	generateSoundData(state);

    formatHomePage(state);

	delete state.commentLevel;
	delete state.names;
	delete state.abbrevNames;
	delete state.objects_candname;
	delete state.objects_section;
	delete state.objects_spritematrix;
	delete state.section;
	delete state.subsection;
	delete state.tokenIndex;
	delete state.visitedSections;
	delete state.loops;
	/*
	var lines = stripComments(str);
	window.console.log(lines);
	var sections = generateSections(lines);
	window.console.log(sections);
	var sss = generateSemiStructuredSections(sections);*/
	return state;
}

var ifrm;

function compile(command, text, randomseed) {
    matchCache = {};
    forceRegenImages = true;
    if (command === undefined) {
        command = ["restart"];
    }
    if (randomseed === undefined) {
        randomseed = null;
    }
    lastDownTarget = canvas;

    if (text === undefined) {
        var code = window.form1.code;

        var editor = code.editorreference;

        text = editor.getValue() + "\n";
    }
    if (canDump === true) {
        compiledText = text;
    }

    errorCount = 0;
    compiling = true;
    errorStrings = [];
    consolePrint('=================================');
    try {
        var state = loadFile(text);
        //		consolePrint(JSON.stringify(state));
    } finally {
        compiling = false;
    }

    if (state && state.levels && state.levels.length === 0) {
        logError('No levels found.  Add some levels!', undefined, true);
    }

    if (errorCount > MAX_ERRORS) {
        return;
    }
    /*catch(err)
    {
    	if (anyErrors===false) {
    		logErrorNoLine(err.toString());
    	}
    }*/

    if (errorCount > 0) {
        if (IDE===false){
            consoleError('<span class="systemMessage">Errors detected during compilation; the game may not work correctly.  If this is an older game, and you think it just broke because of recent changes in the puzzlescript plus engine, consider letting me know via the issue tracker.</span>');
        } else{
            consoleError('<span class="systemMessage">Errors detected during compilation; the game may not work correctly.</span>');
        }
    } else {
        var ruleCount = 0;
        for (var i = 0; i < state.rules.length; i++) {
            ruleCount += state.rules[i].length;
        }
        for (var i = 0; i < state.lateRules.length; i++) {
            ruleCount += state.lateRules[i].length;
        }
        if (command[0] == "restart") {
            consolePrint('<span class="systemMessage">Successful Compilation, generated ' + ruleCount + ' instructions.</span>');
        } else {
            consolePrint('<span class="systemMessage">Successful live recompilation, generated ' + ruleCount + ' instructions.</span>');

        }


        
        if (IDE){
            if (state.metadata.title!==undefined) {
                document.title="PS Plus - " + state.metadata.title;
            }
        }
    }

        //Puzzlescript Plus errors
        if (IDE && state !== undefined) {
            if (state.metadata.tween_length !== undefined && state.lateRules.length >= 1) {
                logWarning("[PS+] Using tweens in a game that also has LATE rules is currently experimental! If you change objects that moved with LATE then tweens might not play!", undefined, true);
            }
    
            if(state.metadata.level_select_unlocked_ahead !== undefined && state.metadata.level_select_unlocked_rollover !== undefined) {
                logWarning("[PS+] You can't use both level_select_unlocked_ahead and level_select_unlocked_rollover at the same time, so please choose only one!", undefined, true);
            }

            if(state.metadata.level_select === undefined && (state.metadata.level_select_lock !== undefined || state.metadata.level_select_unlocked_ahead !== undefined || state.metadata.level_select_unlocked_rollover !== undefined || state.metadata.continue_is_level_select !== undefined || state.metadata.level_select_solve_symbol !== undefined)) {
                logWarning("[PS+] You're using level select prelude flags, but didn't define the 'level_select' flag.", undefined, true);
            }

            if(state.metadata.level_select_lock === undefined && (state.metadata.level_select_unlocked_ahead !== undefined || state.metadata.level_select_unlocked_rollover !== undefined)) {
                logWarning("[PS+] You've defined a level unlock condition, but didn't define the 'level_select_lock' flag.", undefined, true);
            }
        }

    if (state!==null){//otherwise error
        setGameState(state, command, randomseed);
    }

    clearInputHistory();

    if (isSitelocked() && IDE) {
        logError("The game is sitelocked. To continue testing, add the current domain '"+window.location.origin+ "' to the list.", undefined, true);
    }

    consoleCacheDump();

}



function qualifyURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}

function isSitelocked() {
    if (state.metadata.sitelock_origin_whitelist === undefined && state.metadata.sitelock_hostname_whitelist === undefined) {
        return false;
    }

    if (IDE == true) {
        return false; //Don't sitelock in editor
    }

    if (state.metadata.sitelock_origin_whitelist === undefined) {
        var origins = state.metadata.sitelock_origin_whitelist.split(" ");

        var origin = window.location.origin;

        for (var i = 0; i < origins.length; i += 1) {
            if (origin == origins[i]) {
                return false;
            }
        }
    }

    if (state.metadata.sitelock_hostname_whitelist == undefined) {
        var hostnames = state.metadata.sitelock_hostname_whitelist.split(" ");

        var hostname = window.location.hostname;

        for (var i = 0; i < hostnames.length; i += 1) {
            if (hostname == hostnames[i]) {
                return false;
            }
        }
    }

    return true;
}

// @@end js/compiler.js


// @@begin js/soundbar.js

var audio;


function newSound(instrument) {
	var seed = instrument + 100 * ((Math.random() * 1000000) | 1);
	//document.getElementById('sounddat').value = seed;

	var frame = parent.frames[4];
	var code = document.getElementById('consoletextarea');
	consolePrint(generatorNames[instrument] + ' : ' + '<span class="cm-SOUND" onclick="playSound(' + seed.toString() + ')">' + seed.toString() + '</span>',true);
	var params = generateFromSeed(seed);
	params.sound_vol = SOUND_VOL;
	params.sample_rate = SAMPLE_RATE;
	params.bit_depth = BIT_DEPTH;
	var sound = SoundEffect.generate(params);
	sound.play();
}

function buttonPress() {
	var generatortype = 3;
	var seed = document.getElementById('sounddat').value;
	var params = generateFromSeed(seed);
	params.sound_vol = SOUND_VOL;
	params.sample_rate = SAMPLE_RATE;
	params.bit_depth = BIT_DEPTH;
	var sound = SoundEffect.generate(params);
	sound.play();
}

// @@end js/soundbar.js


// @@begin js/toolbar.js
// The client ID of a GitHub OAuth app registered at https://github.com/settings/developers.
// The “callback URL” of that app points to https://www.puzzlescript.net/auth.html.
// If you’re running from another host name, sharing might not work.

const maximumsavedprojects = 50;

function solveClick() {
	if (confirm("Use the solver? It can be slow & crash on big levels, so please save beforehand. Doesn't work for mouse controlled games.")) {
		solve();
	}
}

function runClick() {
	clearConsole();
	compile(["restart"]);
}

function cancelClick() {
	stopSolving();
}

function dateToReadable(title, time)
{
	var year = time.getFullYear();
	var month = time.getMonth()+1;
	var date1 = time.getDate();
	var hour = time.getHours();
	var minutes = time.getMinutes();
	var seconds = time.getSeconds();

	if (month < 10) {
    	month = "0"+month;
	}
	if (date1 < 10) {
		date1 = "0"+date1;
	}
	if (hour < 10) {
		hour = "0"+hour;
	}
	if (minutes < 10) {
		minutes = "0"+minutes;
	}
	if (seconds < 10) {
		seconds = "0"+seconds;
	}

	var result = hour+":"+minutes+" "+year + "-" + month+"-"+date1+" "+title;
	return result;
}

function saveClick() {

	var title = "Untitled";
	if (state.metadata.title!==undefined) {
		title=state.metadata.title;
	}
	var text=editor.getValue();
	var saveDat = {
		title:title,
		text:text,
		date: new Date()
	}

	var curSaveArray = [];
	if (storage_has('saves')) {
		var curSaveArray = JSON.parse(storage_get('saves'));
	}

	if (curSaveArray.length>maximumsavedprojects) {
		curSaveArray.splice(0,1);
	}
	curSaveArray.push(saveDat);


	var savesDatStr = JSON.stringify(curSaveArray);
	try {
	storage_set('saves',savesDatStr);
	}
	catch (e) {
		console.log(e);
		consoleError("Was not able to save the project. This likely has something to do with your cookie settings or, if you've already saved some projects, with local storage size limits.")
		return;
	}

	repopulateSaveDropdown(curSaveArray);

	var loadDropdown = document.getElementById('loadDropDown');
	loadDropdown.selectedIndex=0;

	setEditorClean();

	var escapeHTMLTitle = title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	consolePrint("saved file '"+escapeHTMLTitle+"' to local storage",true);
	if (window.location.href.indexOf("?hack")>=0){
		var currURL= window.location.href; 
		var afterDomain= currURL.substring(currURL.lastIndexOf('/') + 1);
		var beforeQueryString= afterDomain.split("?")[0];  
 
		window.history.pushState({}, document.title, "./" +beforeQueryString);
	}
	//clear parameters from url bar if any present
	if (curSaveArray.length===maximumsavedprojects){
		consolePrint("WARNING: your <i>locally saved file list</i> has reached its maximum capacity of "+maximumsavedprojects+" files - older saved files will be deleted when you save in future.",true);
	}
}

window.addEventListener( "pageshow", function ( event ) {
	var historyTraversal = event.persisted || 
						   ( typeof window.performance != "undefined" && 
								window.performance.navigation.type === 2 );
	if ( historyTraversal ) {
	  // Handle page restore.
	  window.location.reload();
	}
  });

window.addEventListener("popstate", function(event){
	console.log("hey");
	location.reload();
});

function loadDropDownChange() {

	if(!canExit()) {
 		this.selectedIndex = 0;
 		return;
 	}

	var saveString = storage_get('saves');
	if (saveString === null) {
			consolePrint("Eek, trying to load a file, but there's no local storage found. Eek!",true);
	} 

	saves = JSON.parse(saveString);
	
	for (var i=0;i<saves.length;i++) {
		var sd = saves[i];
	    var key = dateToReadable(sd.title,new Date(sd.date));
	    if (key==this.value) {

	    	var saveText = sd.text;
			editor.setValue(saveText);
			clearConsole();
			setEditorClean();
			var loadDropdown = document.getElementById('loadDropDown');
			loadDropdown.selectedIndex=0;
			unloadGame();
			compile(["restart"]);
			return;
	    }
	}		

	consolePrint("Eek, trying to load a save, but couldn't find it. :(",true);
}


function repopulateSaveDropdown(saves) {
	var loadDropdown = document.getElementById('loadDropDown');
	loadDropdown.options.length = 0;

	if (saves===undefined) {
		try {
			if (!storage_has('saves')) {
				return;
			} else {
				saves = JSON.parse(storage_get("saves"));
			}
		} catch (ex) {
			return;
		}
	}

    var optn = document.createElement("OPTION");
    optn.text = "Load";
    optn.value = "Load";
    loadDropdown.options.add(optn);  

	for (var i=saves.length-1;i>=0;i--) {			
		var sd = saves[i];
	    var optn = document.createElement("OPTION");
	    var key = dateToReadable(sd.title,new Date(sd.date));
	    optn.text = key;
	    optn.value = key;
	    loadDropdown.options.add(optn);  
	}
	loadDropdown.selectedIndex=0;
}

repopulateSaveDropdown();
var loadDropdown = document.getElementById('loadDropDown');
loadDropdown.selectedIndex=0;

function levelEditorClick_Fn() {
	if (textMode || state.levels.length===0) {
		compile(["loadLevel",0]);
		levelEditorOpened=true;
    	canvasResize();
	} else {
		levelEditorOpened=!levelEditorOpened;
    	canvasResize();
    }
    lastDownTarget=canvas;	
}

// const HOSTPAGEURL = "http://www.puzzlescript.net"
// const PSFORKNAME = "PuzzleScript"
const HOSTPAGEURL = "https://auroriax.github.io/PuzzleScript"
const PSFORKNAME = "Puzzlescript Plus"

/* I don't want to setup the required server for an OAuth App, so for now we will use a slightly more complex method for the user, which is to create a personal identification token. */
// OAUTH_CLIENT_ID = "211570277eb588cddf44";
function getAuthURL()
{
	return HOSTPAGEURL+'/auth_pat.html';
	// const randomState = window.btoa(Array.prototype.map.call(
	// 	window.crypto.getRandomValues(new Uint8Array(24)),
	// 	function(x) { return String.fromCharCode(x); }).join(""));

	// return "https://github.com/login/oauth/authorize"
	// 	+ "?client_id=" + OAUTH_CLIENT_ID
	// 	+ "&scope=gist"
	// 	+ "&state=" + randomState
	// 	+ "&allow_signup=true";
}

function printUnauthorized()
{
	const authUrl = getAuthURL();
	consolePrint(
		"<br>"+PSFORKNAME+" needs permission to share/save games through GitHub:<br><ul><li><a target=\"_blank\" href=\"" + authUrl + "\">Give "+PSFORKNAME+" permission</a></li></ul>",
		true
	);
}

function shareClick() {
	var oauthAccessToken = storage_get("oauth_access_token");
	if (typeof oauthAccessToken !== "string") {
		// Generates 32 letters of random data, like "liVsr/e+luK9tC02fUob75zEKaL4VpQn".
		printUnauthorized();
		return;
	}

	consolePrint("<br>Sending code to github...", true)
	const title = (state.metadata.title !== undefined) ? state.metadata.title + " ("+PSFORKNAME+" Script)" : "Untitled "+PSFORKNAME+" Script";
	
	compile(["rebuild"]);


	const source = editor.getValue();

	var gistToCreate = {
		"description" : title,
		"public" : true,
		"files": {
			"readme.txt" : {
				"content": "Play this game by pasting the script in "+HOSTPAGEURL+"/editor.html"
			},
			"script.txt" : {
				"content": source
			}
		}
	};

	const githubURL = 'https://api.github.com/gists';
	var githubHTTPClient = new XMLHttpRequest();
	githubHTTPClient.open('POST', githubURL);
	githubHTTPClient.onreadystatechange = function()
	{
		if(githubHTTPClient.readyState != 4)
			return;
		var result = JSON.parse(githubHTTPClient.responseText);
		if (githubHTTPClient.status === 403)
		{
			consoleError(result.message);
		}
		else if (githubHTTPClient.status !== 200 && githubHTTPClient.status !== 201)
		{
			if (githubHTTPClient.statusText==="Unauthorized"){
				consoleError("Authorization check failed.  You have to log back into GitHub (or give it permission again or something).");
				storage_remove("oauth_access_token");
			} else {
				consoleError("HTTP Error "+ githubHTTPClient.status + ' - ' + githubHTTPClient.statusText);
				consoleError("Try giving "+PSFORKNAME+" permission again, that might fix things...");
			}
			printUnauthorized();
		}
		else
		{
			const id = result.id;
			const url = qualifyURL("play.html?p="+id);

			const editurl = qualifyURL("editor.html?hack="+id);
			const sourceCodeLink = "Link to source code:<br><a target=\"_blank\"  href=\""+editurl+"\">"+editurl+"</a>";


			consolePrint('GitHub (<a onclick="githubLogOut();"  href="javascript:void(0);">log out</a>) submission successful.<br>',true);

			consolePrint('<br>'+sourceCodeLink,true);


			if (errorCount>0) {
				consolePrint("<br>Cannot link directly to playable game, because there are compiler errors.",true);
			} else {
				consolePrint("<br>The game can now be played at this url:<br><a target=\"_blank\" href=\""+url+"\">"+url+"</a>",true);
			} 

		}
	}
	githubHTTPClient.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	githubHTTPClient.setRequestHeader("Authorization", "token "+oauthAccessToken);
	const stringifiedGist = JSON.stringify(gistToCreate);
	githubHTTPClient.send(stringifiedGist);
    lastDownTarget=canvas;	
}

function githubLogOut(){
	storage_remove("oauth_access_token");

	const authUrl = getAuthURL();
	consolePrint(
		"<br>Logged out of Github.<br>" +
		"<ul>" +
		"<li><a target=\"_blank\" href=\"" + authUrl + "\">Give "+PSFORKNAME+" permission</a></li>" +
		"</ul>"
				,true);
}

function rebuildClick() {
	compile(["rebuild"]);
}

function post_to_url(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
}

function exportClick() {
	var sourceCode = editor.getValue();

	compile("restart");

	var sourceString = JSON.stringify(sourceCode);
	
	buildStandalone(sourceString);
}

// @@end js/toolbar.js


// @@begin js/layout.js
var soundbarwidth = 100;
var lowerbarheight = document.getElementById("soundbar").clientHeight;
var upperbarheight = document.getElementById("uppertoolbar").clientHeight;
var winwidth = window.innerWidth;
var winheight = window.innerHeight;
var verticaldragbarWidth = document.getElementById("verticaldragbar").clientWidth;
var horizontaldragbarHeight = document.getElementById("horizontaldragbar").clientHeight;
var minimumDimension = 100;

function resize_widths(verticaldragbarX){
	document.getElementById("leftpanel").style.width = verticaldragbarX + "px";
	document.getElementById("righttophalf").style.left = verticaldragbarX + verticaldragbarWidth + "px";
	document.getElementById("rightbottomhalf").style.left = verticaldragbarX + verticaldragbarWidth + "px";
	document.getElementById("horizontaldragbar").style.left = verticaldragbarX + verticaldragbarWidth + "px";
	document.getElementById("verticaldragbar").style.left = verticaldragbarX + "px";
	canvasResize();
}

function resize_heights(horizontaldragbarY){
	document.getElementById("leftpanel").style.height = (window.innerHeight - upperbarheight) + "px";
	document.getElementById("verticaldragbar").style.height = (window.innerHeight - upperbarheight) + "px";
	
	document.getElementById("righttophalf").style.height = horizontaldragbarY - upperbarheight + "px";
	document.getElementById("rightbottomhalf").style.top = horizontaldragbarY + horizontaldragbarHeight + "px";
	document.getElementById("horizontaldragbar").style.top = horizontaldragbarY + "px";
	canvasResize();
}

function resize_all(e){
	const smallmovelimit = 100;
	
	let hdiff = window.innerWidth - winwidth;
	let verticaldragbarX = parseInt(document.getElementById("verticaldragbar").style.left.replace("px",""));
	
	if(hdiff > -smallmovelimit && hdiff < smallmovelimit){
		verticaldragbarX += hdiff;
	} else {
		verticaldragbarX *= window.innerWidth/winwidth;
	};
	
	if ((verticaldragbarX <= minimumDimension)){
		verticaldragbarX = minimumDimension;
	} else if ((window.innerWidth - verticaldragbarX) < soundbarwidth){
		verticaldragbarX = window.innerWidth - soundbarwidth;
	};
	resize_widths(verticaldragbarX);
	
	
	
	let horizontaldragbarY = parseInt(document.getElementById("horizontaldragbar").style.top.replace("px",""));
	let vdiff = window.innerHeight - winheight;
	
	if(vdiff > -smallmovelimit && vdiff < smallmovelimit){
		horizontaldragbarY += vdiff;
	} else {
		horizontaldragbarY *= window.innerHeight/winheight;
	};
	
	if ((horizontaldragbarY <= upperbarheight + minimumDimension)){
		horizontaldragbarY = upperbarheight + minimumDimension;
	} else if ((window.innerHeight - horizontaldragbarY) < (lowerbarheight + minimumDimension)){
		horizontaldragbarY = window.innerHeight - (lowerbarheight + minimumDimension + 5);
	};
	resize_heights(horizontaldragbarY);
	
	winwidth = window.innerWidth;
	winheight = window.innerHeight;
};

function verticalDragbarMouseDown(e) {
	e.preventDefault();
	document.body.style.cursor = "col-resize";
	window.addEventListener("mousemove", verticalDragbarMouseMove, false);
	window.addEventListener("mouseup", verticalDragbarMouseUp, false);
};

function verticalDragbarMouseMove(e) {
	if (e.pageX <= minimumDimension){
		resize_widths(minimumDimension);
	} else if ((window.innerWidth - e.pageX) > soundbarwidth){
		resize_widths(e.pageX - 1);
	} else {
		resize_widths(window.innerWidth - soundbarwidth);
	};
};

function verticalDragbarMouseUp(e) {
	document.body.style.cursor = "";
	window.removeEventListener("mousemove", verticalDragbarMouseMove, false);
};

function horizontalDragbarMouseDown(e) {
	e.preventDefault();
	document.body.style.cursor = "row-resize";
	window.addEventListener("mousemove", horizontalDragbarMouseMove, false);
	window.addEventListener("mouseup", horizontalDragbarMouseUp, false);
};

function horizontalDragbarMouseMove(e) {
	if (e.pageY <= (upperbarheight + minimumDimension)) {
		resize_heights(upperbarheight + minimumDimension);
	} else if ((window.innerHeight - e.pageY) > (lowerbarheight + minimumDimension)){
		resize_heights(e.pageY - 1);
	} else {
		resize_heights(window.innerHeight - lowerbarheight - minimumDimension);
	}
};

function horizontalDragbarMouseUp(e) {
	document.body.style.cursor = "";
	window.removeEventListener("mousemove", horizontalDragbarMouseMove, false);
};

function reset_panels(){
	resize_widths(Math.floor(window.innerWidth/2));
	resize_heights(Math.floor(window.innerHeight/2));
	winwidth = window.innerWidth;
	winheight = window.innerHeight;
};
// @@end js/layout.js


// @@begin js/addlisteners.js
/*onmousemove="onMouseMove(event)";
onmousein="onMouseIn()";
onmouseout="onMouseOut()";

var el = document.getElementById("gameCanvas");
if (el.addEventListener) {
    //el.addEventListener("contextmenu", rightClickCanvas, false);
    //el.addEventListener("mousemove", mouseMove, false);
    el.addEventListener("mouseout", onMouseOut, false);
} else {
    el.attachEvent('oncontextmenu', rightClickCanvas);
    el.attachEvent('onmousemove', onMouseMove);
    el.attachEvent('onmousein', onMouseIn);
    el.attachEvent('onmouseout', onMouseOut);
}  
*/
// @@end js/addlisteners.js


// @@begin js/addlisteners_editor.js

for (var i=0;i<10;i++) {
	var idname = "newsound"+i;
	var el = document.getElementById(idname);
    el.addEventListener("click", (function(n){return function(){return newSound(n);};})(i), false);
}

//var soundButtonPress = document.getElementById("soundButtonPress");
//soundButtonPress.addEventListener("click", buttonPress, false);

var solveClickLink = document.getElementById("solveClickLink");
solveClickLink.addEventListener("click", solveClick, false);

var cancelClickLink = document.getElementById("cancelClickLink");
cancelClickLink.addEventListener("click", cancelClick, false);

var runClickLink = document.getElementById("runClickLink");
runClickLink.addEventListener("click", runClick, false);

var saveClickLink = document.getElementById("saveClickLink");
saveClickLink.addEventListener("click", saveClick, false);

var rebuildClickLink = document.getElementById("rebuildClickLink");
rebuildClickLink.addEventListener("click", rebuildClick, false);

var shareClickLink = document.getElementById("shareClickLink");
shareClickLink.addEventListener("click", shareClick, false);

var levelEditorClickLink = document.getElementById("levelEditorClickLink");
levelEditorClickLink.addEventListener("click", levelEditorClick_Fn, false);

var exportClickLink = document.getElementById("exportClickLink");
exportClickLink.addEventListener("click", exportClick, false);

var exampleDropdown = document.getElementById("exampleDropdown");
exampleDropdown.addEventListener("change", dropdownChange, false);

var loadDropDown = document.getElementById("loadDropDown");
loadDropDown.addEventListener("change", loadDropDownChange, false);

var horizontalDragbar = document.getElementById("horizontaldragbar");
horizontalDragbar.addEventListener("mousedown", horizontalDragbarMouseDown, false);

var verticalDragbar = document.getElementById("verticaldragbar");
verticalDragbar.addEventListener("mousedown", verticalDragbarMouseDown, false);

window.addEventListener("resize", resize_all, false);
window.addEventListener("load", reset_panels, false);

/* https://github.com/ndrake/PuzzleScript/commit/de4ac2a38865b74e66c1d711a25f0691079a290d */
window.onbeforeunload = function (e) {
  var e = e || window.event;
  var msg = 'You have unsaved changes!';

  if(_editorDirty) {      

    // For IE and Firefox prior to version 4
    if (e) {
      e.returnValue = msg;
    }

    // For Safari
    return msg;
  }
};

var gestureHandler = Mobile.enable();
if (gestureHandler) {
    gestureHandler.setFocusElement(document.getElementById('gameCanvas'));
}

// @@end js/addlisteners_editor.js


// @@begin js/makegif.js
function makeGIF() {
	var randomseed = RandomGen.seed;
	levelEditorOpened=false;
	var targetlevel=curlevel;
	var gifcanvas = document.createElement('canvas');
	gifcanvas.width=screenwidth*cellwidth;
	gifcanvas.height=screenheight*cellheight;
	gifcanvas.style.width=screenwidth*cellwidth;
	gifcanvas.style.height=screenheight*cellheight;

	var gifctx = gifcanvas.getContext('2d');

	var inputDat = inputHistory.concat([]);
	

	unitTesting=true;
	levelString=compiledText;



	var encoder = new GIFEncoder();
	encoder.setRepeat(0); //auto-loop
	encoder.setDelay(200);
	encoder.start();

	compile(["loadLevel",curlevel],levelString,randomseed);
	canvasResize();
	redraw();

	if (state !== undefined && state.metadata.smoothscreen != null) {
		consolePrint('<span class="errorText">GIF recorder does not work with smoothscreen, sorry. :( You could try an external GIF recording application instead.</span>');
		return;
	}

	gifctx.drawImage(canvas,-xoffset,-yoffset);
  	encoder.addFrame(gifctx);
	var autotimer=0;

  	for(var i=0;i<inputDat.length;i++) {
  		var realtimeframe=false;
		var val=inputDat[i];
		if (val==="undo") {
			DoUndo(false,true);
		} else if (val==="restart") {
			DoRestart();
		} else if (val=="tick") {			
			processInput(-1);
			realtimeframe=true;
		} else {
			processInput(val);
		}
		redraw();
		gifctx.drawImage(canvas,-xoffset,-yoffset);
		encoder.addFrame(gifctx);
		encoder.setDelay(realtimeframe?autotickinterval:repeatinterval);
		autotimer+=repeatinterval;

		while (againing) {
			processInput(-1);		
			redraw();
			encoder.setDelay(againinterval);
			gifctx.drawImage(canvas,-xoffset,-yoffset);
	  		encoder.addFrame(gifctx);	
		}
	}

	encoder.finish();
	const data_url = 'data:image/gif;base64,'+btoa(encoder.stream().getData());
	consolePrint('<img class="generatedgif" src="'+data_url+'">');
	consolePrint('<a href="'+data_url+'" download>Download GIF</a>');
  	
  	unitTesting = false;

        inputHistory = inputDat;
}

// @@end js/makegif.js


// @@begin js/solver.js
var abortSolver = false;
var solving = false;

const timeout = ms => new Promise(res => setTimeout(res, ms))

function byScoreAndLength(a, b) {
	if(a[0] != b[0]) {
		return a[0] < b[0];
	} else {
		return a[2].length < b[2].length;
	}
}

var distanceTable;

async function solve() {
	if(levelEditorOpened) return;
	if(solving) return;
	if(textMode || state.levels.length === 0) return;
	var was_verbose_logging = false;
	if (verbose_logging) {
		verbose_logging = false;
		cache_console_messages = false;
		was_verbose_logging = true;
		consolePrint("Disabling verbose logging to speed up solver")
	}
	precalcDistances();
	abortSolver = false;
	muted = true;
	solving = true;
	restartTarget = backupLevel();
	hasUsedCheckpoint = false;
	backups = [];
	var oldDT = deltatime;
	deltatime = 0;
	var actions = [0, 1, 2, 3, 4];
	if('noaction' in state.metadata) {
		actions = [0, 1, 2, 3];
	}
	var act2str = "uldrx";
	var exploredStates = {};
	exploredStates[level.objects] = true;
	var queue = new FastPriorityQueue(byScoreAndLength);
	queue.add([0, level.objects.slice(0), ""]);
	consolePrint("searching...");
	var solvingProgress = document.getElementById("solvingProgress");
	var cancelLink = document.getElementById("cancelClickLink");
	cancelLink.hidden = false;
	// console.log("searching...");
	var iters = 0;
	var size = 1;
	var discovered = 1;

	while(!queue.isEmpty()) {
		if(abortSolver) {
			consolePrint("solver aborted");
			cancelLink.hidden = true;

			verbose_logging = was_verbose_logging;
			cache_console_messages = was_verbose_logging;

			break;
		}
		iters++;
		if(iters > 250) {
			iters = 0;
			// consolePrint("searched: " + size + " queue: " + discovered);
			// console.log(discovered, size);
			solvingProgress.innerHTML = "searched: " + size;
			redraw();
			await timeout(1);
		}
		var temp = queue.poll();
		var parentState = temp[1];
		var ms = temp[2];
		discovered--;
		shuffleALittle(actions);
		for(var i = 0, len = actions.length; i < len; i++) {
			for(var k = 0, len2 = parentState.length; k < len2; k++) {
				level.objects[k] = parentState[k];
			}
			var changedSomething = processInput(actions[i]);
			while(againing) {
				changedSomething = processInput(-1) || changedSomething;
			}
			
			if(changedSomething) {
				if(level.objects in exploredStates) {
					continue;
				}
				var nms = ms + act2str[actions[i]];
				if(winning || hasUsedCheckpoint) {
					hasUsedCheckpoint = false;
					var chunks = "(" + chunkString(nms, 5).join(" ") + ")";

					verbose_logging = true;
					cache_console_messages = true;

					consolePrint("solution found: (" + nms.length + " steps, " + size + " positions explored)");
					consolePrint(chunks);
					console.log("solution found:\n" + chunks);


					var step_limit = 200;
					if (nms.length >= step_limit) {
						consolePrint("More than "+step_limit + " steps needed to solve puzzle, not printing individual states");
					} else {

						winning = false;
						verbose_logging = false;
						//Reload starting state
						DoRestart();

						addToDebugTimeline(level, 0);

						for(var i = 0; i != nms.length; i++) {

							var char = nms[i];

							var action = -1;

							for (j=0; j != act2str.length; j++) {
								if (char == act2str[j]) {
									action = j; break;
								}
							}

							verbose_logging = false;

							var again_turns = 0;
							processInput(action);
							while(againing) {
								processInput(-1);
								again_turns++;
							}
							verbose_logging = true;

							var turn_id = addToDebugTimeline(level, i+2);

							var txt = "Turn "+(i+1)+", input "+char;
							if (again_turns >= 1) {
								txt += " (again turns: "+again_turns+")";
							}
							consolePrint(txt, false, null, turn_id);
						}
					}			

					solvingProgress.innerHTML = "";
					deltatime = oldDT;
					DoRestart();

					cache_console_messages = was_verbose_logging;
					verbose_logging = was_verbose_logging;

					solving = false;
					muted = false;
					winning = false;
					playSound(13219900);

					redraw();
					cancelLink.hidden = true;
					return;
				}
				exploredStates[level.objects] = true;
				size++;
				queue.add([getScore(), level.objects.slice(0), nms]);
				discovered++;
			}
		}
	}
	muted = false;
	solving = false;
	DoRestart();
	consolePrint("no solution found (" + size + " positions explored)");
	console.log("no solution found");

	verbose_logging = was_verbose_logging;
	cache_console_messages = was_verbose_logging;

	solvingProgress.innerHTML = "";
	deltatime = oldDT;
	playSound(52291704);
	redraw();
	cancelLink.hidden = true;
}

function stopSolving() {
	abortSolver = true;
}

function chunkString(str, length) {
	return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

function shuffleALittle(array) {
	randomIndex = 1 + Math.floor(Math.random() * (array.length - 1));
	temporaryValue = array[0];
	array[0] = array[randomIndex];
	array[randomIndex] = temporaryValue;
}

function distance(index1, index2) {
	return Math.abs(Math.floor(index1 / level.height) - Math.floor(index2 / level.height)) + Math.abs( (index1 % level.height) - (index2 % level.height) );
}

function precalcDistances() {
	distanceTable = [];
	for(var i = 0; i < level.n_tiles; i++) {
		ds = [];
		for(var j = 0; j < level.n_tiles; j++) {
			ds.push(distance(i, j));
		}
		distanceTable.push(ds);
	}
}

function getScore() {
	var score = 0.0;
	var maxDistance = level.width + level.height;
	if(state.winconditions.length > 0)  {
		for(var wcIndex=0;wcIndex<state.winconditions.length;wcIndex++) {
			var wincondition = state.winconditions[wcIndex];
			var filter1 = wincondition[1];
			var filter2 = wincondition[2];
			if(wincondition[0] == -1) {
				// "no" conditions
				for(var i = 0; i < level.n_tiles; i++) {
					var cell = level.getCellInto(i,_o10);
					if( ( !filter1.bitsClearInArray(cell.data) ) && ( !filter2.bitsClearInArray(cell.data) ) ) {
						score += 1.0; // penalization for each case
					}
				}
			} else {
				// "some" or "all" conditions
				for(var i = 0; i < level.n_tiles; i++) {
					if(!filter1.bitsClearInArray(level.getCellInto(i, _o10).data)) {
						var minDistance = maxDistance;
						for (var j = 0; j < level.n_tiles; j++) {
							if(!filter2.bitsClearInArray(level.getCellInto(j, _o10).data)) {
								var dist = distanceTable[i][j];
								if(dist < minDistance) {
									minDistance = dist;
								}
							}
						}
						score += minDistance;
					}
				}
			}
		}
	}
	// console.log(score);
	return score;
}


// @@end js/solver.js


// @@begin js/FastPriorityQueue.js
/**
 * FastPriorityQueue.js : a fast heap-based priority queue  in JavaScript.
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 * Speed-optimized heap-based priority queue for modern browsers and JavaScript engines.
 *
 * Usage :
         Installation (in shell, if you use node):
         $ npm install fastpriorityqueue

         Running test program (in JavaScript):

         // var FastPriorityQueue = require("fastpriorityqueue");// in node
         var x = new FastPriorityQueue();
         x.add(1);
         x.add(0);
         x.add(5);
         x.add(4);
         x.add(3);
         x.peek(); // should return 0, leaves x unchanged
         x.size; // should return 5, leaves x unchanged
         while(!x.isEmpty()) {
           console.log(x.poll());
         } // will print 0 1 3 4 5
         x.trim(); // (optional) optimizes memory usage
 */
'use strict';

var defaultcomparator = function(a, b) {
  return a < b;
};

// the provided comparator function should take a, b and return *true* when a < b
function FastPriorityQueue(comparator) {
  if (!(this instanceof FastPriorityQueue)) return new FastPriorityQueue(comparator);
  this.array = [];
  this.size = 0;
  this.compare = comparator || defaultcomparator;
}

FastPriorityQueue.prototype.clone = function() {
  var fpq = new FastPriorityQueue(this.compare);
  fpq.size = this.size;
  for (var i = 0; i < this.size; i++) {
    fpq.array.push(this.array[i]);
  }
  return fpq;
};

// Add an element into the queue
// runs in O(log n) time
FastPriorityQueue.prototype.add = function(myval) {
  var i = this.size;
  this.array[this.size] = myval;
  this.size += 1;
  var p;
  var ap;
  while (i > 0) {
    p = (i - 1) >> 1;
    ap = this.array[p];
    if (!this.compare(myval, ap)) {
      break;
    }
    this.array[i] = ap;
    i = p;
  }
  this.array[i] = myval;
};

// replace the content of the heap by provided array and "heapifies it"
FastPriorityQueue.prototype.heapify = function(arr) {
  this.array = arr;
  this.size = arr.length;
  var i;
  for (i = this.size >> 1; i >= 0; i--) {
    this._percolateDown(i);
  }
};

// for internal use
FastPriorityQueue.prototype._percolateUp = function(i, force) {
  var myval = this.array[i];
  var p;
  var ap;
  while (i > 0) {
    p = (i - 1) >> 1;
    ap = this.array[p];
    // force will skip the compare
    if (!force && !this.compare(myval, ap)) {
      break;
    }
    this.array[i] = ap;
    i = p;
  }
  this.array[i] = myval;
};

// for internal use
FastPriorityQueue.prototype._percolateDown = function(i) {
  var size = this.size;
  var hsize = this.size >>> 1;
  var ai = this.array[i];
  var l;
  var r;
  var bestc;
  while (i < hsize) {
    l = (i << 1) + 1;
    r = l + 1;
    bestc = this.array[l];
    if (r < size) {
      if (this.compare(this.array[r], bestc)) {
        l = r;
        bestc = this.array[r];
      }
    }
    if (!this.compare(bestc, ai)) {
      break;
    }
    this.array[i] = bestc;
    i = l;
  }
  this.array[i] = ai;
};

// internal
// _removeAt(index) will delete the given index from the queue,
// retaining balance. returns true if removed.
FastPriorityQueue.prototype._removeAt = function(index) {
  if (this.isEmpty() || index > this.size - 1 || index < 0) return false;

  // impl1:
  //this.array.splice(index, 1);
  //this.heapify(this.array);
  // impl2:
  this._percolateUp(index, true);
  this.poll();
  return true;
};

// remove(myval[, comparator]) will remove the given item from the
// queue, checked for equality by using compare if a new comparator isn't provided.
// (for exmaple, if you want to remove based on a seperate key value, not necessarily priority).
// return true if removed.
FastPriorityQueue.prototype.remove = function(myval, comparator) {
  if (!comparator) {
    comparator = this.compare;
  }
  if (this.isEmpty()) return false;
  for (var i = 0; i < this.size; i++) {
    if (comparator(this.array[i], myval) || comparator(myval, this.array[i])) {
      continue;
    }
    // items are equal, remove
    return this._removeAt(i);
  }
  return false;
};

// Look at the top of the queue (a smallest element)
// executes in constant time
//
// Calling peek on an empty priority queue returns
// the "undefined" value.
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/undefined
//
FastPriorityQueue.prototype.peek = function() {
  if (this.size == 0) return undefined;
  return this.array[0];
};

// remove the element on top of the heap (a smallest element)
// runs in logarithmic time
//
// If the priority queue is empty, the function returns the
// "undefined" value.
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/undefined
//
// For long-running and large priority queues, or priority queues
// storing large objects, you may  want to call the trim function
// at strategic times to recover allocated memory.
FastPriorityQueue.prototype.poll = function() {
  if (this.size == 0) return undefined;
  var ans = this.array[0];
  if (this.size > 1) {
    this.array[0] = this.array[--this.size];
    this._percolateDown(0 | 0);
  } else {
    this.size -= 1;
  }
  return ans;
};

// This function adds the provided value to the heap, while removing
//  and returning the peek value (like poll). The size of the priority
// thus remains unchanged.
FastPriorityQueue.prototype.replaceTop = function(myval) {
  if (this.size == 0) return undefined;
  var ans = this.array[0];
  this.array[0] = myval;
  this._percolateDown(0 | 0);
  return ans;
};

// recover unused memory (for long-running priority queues)
FastPriorityQueue.prototype.trim = function() {
  this.array = this.array.slice(0, this.size);
};

// Check whether the heap is empty
FastPriorityQueue.prototype.isEmpty = function() {
  return this.size === 0;
};

// iterate over the items in order, pass a callback that receives (item, index) as args.
// TODO once we transpile, uncomment
// if (Symbol && Symbol.iterator) {
//   FastPriorityQueue.prototype[Symbol.iterator] = function*() {
//     if (this.isEmpty()) return;
//     var fpq = this.clone();
//     while (!fpq.isEmpty()) {
//       yield fpq.poll();
//     }
//   };
// }
FastPriorityQueue.prototype.forEach = function(callback) {
  if (this.isEmpty() || typeof callback != 'function') return;
  var i = 0;
  var fpq = this.clone();
  while (!fpq.isEmpty()) {
    callback(fpq.poll(), i++);
  }
};

// return the k 'smallest' elements of the queue
// runs in O(k log k) time
// this is the equivalent of repeatedly calling poll, but
// it has a better computational complexity, which can be
// important for large data sets.
FastPriorityQueue.prototype.kSmallest = function(k) {
  if (this.size == 0) return [];
  var comparator = this.compare;
  var arr = this.array
  var fpq = new FastPriorityQueue(function(a,b){
   return comparator(arr[a],arr[b]);
  });
  k = Math.min(this.size, k);
  var smallest = new Array(k);
  var j = 0;
  fpq.add(0);
  while (j < k) {
    var small = fpq.poll();
    smallest[j++] = this.array[small];
    var l = (small << 1) + 1;
    var r = l + 1;
    if (l < this.size) fpq.add(l);
    if (r < this.size) fpq.add(r);
  }
  return smallest;
}


// @@end js/FastPriorityQueue.js


